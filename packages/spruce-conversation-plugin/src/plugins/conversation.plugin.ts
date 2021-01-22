import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { Log, Skill, SkillFeature } from '@sprucelabs/spruce-skill-utils'
import TopicLoader from '../conversations/TopicLoader'
import SpruceError from '../errors/SpruceError'
import { ConversationHealthCheckItem } from '../types/conversation.types'

export class ConversationFeature implements SkillFeature {
	private skill: Skill
	private log: Log
	private isExecuting = false

	public constructor(skill: Skill) {
		this.skill = skill
		this.log = skill.buildLog('feature.conversation')
	}

	public async execute(): Promise<void> {
		this.assertDependencies()
		this.isExecuting = true
		await this.syncTopics()
		this.isExecuting = false
	}

	private async syncTopics() {
		const topics = await TopicLoader.loadTopics(this.skill.activeDir)

		this.log.info(`Found ${topics.length} conversation topics.`)

		if (topics.length > 0) {
			const events = this.skill.getFeatureByCode('event') as EventFeature

			const { client } = await events.connectToApi()

			this.log.info('Unregistering past conversation topics.')

			const unregisterResults = await client.emit(
				'unregister-conversation-topics::v2020_12_25',
				{
					payload: { shouldUnregisterAll: true },
				}
			)

			eventResponseUtil.getFirstResponseOrThrow(unregisterResults)

			this.log.info('Registering new topics.')

			const results = await client.emit(
				`register-conversation-topics::v2020_12_25`,
				{ payload: { topics: topics.map((topic) => ({ key: topic.key })) } }
			)

			eventResponseUtil.getFirstResponseOrThrow(results)

			this.log.info('Topics now in sync.')
		}
	}

	public async checkHealth(): Promise<ConversationHealthCheckItem> {
		this.assertDependencies()

		try {
			const topics = await TopicLoader.loadTopics(this.skill.activeDir)
			return {
				status: 'passed',
				topics: topics.map((t) => t.key),
			}
		} catch (err) {
			return {
				status: 'failed',
				topics: [],
				errors: [
					new SpruceError({
						code: 'CONVERSATION_PLUGIN_ERROR',
						originalError: err,
					}),
				],
			}
		}
	}

	private assertDependencies() {
		try {
			this.skill.getFeatureByCode('event')
		} catch {
			throw new SpruceError({
				code: 'MISSING_DEPENDENCIES',
				dependencies: ['event.plugin'],
			})
		}
	}

	public async isInstalled(): Promise<boolean> {
		return true
	}

	public async destroy() {
		while (this.isExecuting) {
			await new Promise((resolve) => setTimeout(resolve, 250))
		}
	}

	public isBooted() {
		return false
	}
}

export default (skill: Skill) => {
	const feature = new ConversationFeature(skill)
	skill.registerFeature('conversation', feature)
}
