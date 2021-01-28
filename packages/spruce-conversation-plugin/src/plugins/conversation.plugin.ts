import { EventContract, CoreEventContract } from '@sprucelabs/mercury-types'
import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { Log, Skill, SkillFeature } from '@sprucelabs/spruce-skill-utils'
import { ConversationCoordinator } from '../conversations/ConversationCoordinator'
import TopicLoader from '../conversations/TopicLoader'
import SpruceError from '../errors/SpruceError'
import { ConversationHealthCheckItem } from '../types/conversation.types'

export class ConversationFeature implements SkillFeature {
	private skill: Skill
	private log: Log
	private isExecuting = false
	private _isBooted = false
	private executeResolver?: any

	public constructor(skill: Skill) {
		this.skill = skill
		this.log = skill.buildLog('feature.conversation')
	}

	public async execute(): Promise<void> {
		this.assertDependencies()
		this.isExecuting = true

		await this.syncTopics()

		const client = await this.connectToApi()

		const coordinator = await ConversationCoordinator.Coordinator({
			topicLookupPath: this.skill.activeDir,
			sendMessageHandler: async (message) => {
				try {
					const { target, ...values } = message

					const results = await client.emit('send-message::v2020_12_25', {
						target,
						payload: {
							message: values,
						},
					})

					eventResponseUtil.getFirstResponseOrThrow(results)
				} catch (err) {
					this.log.error(err.message)
				}
			},
		})

		await client.on('did-message::v2020_12_25', async (targetAndPayload) => {
			const { message, topic } = targetAndPayload.payload
			//@ts-ignore
			return coordinator.handleMessage(message, topic)
		})

		this.isExecuting = false
		this._isBooted = true

		this.log.info('Conversations loaded. Ready to chat when you are. 🤘')

		await new Promise((resolve) => {
			this.executeResolver = resolve
		})
	}

	private async syncTopics() {
		const topics = await TopicLoader.loadTopics(this.skill.activeDir)

		this.log.info(`Found ${topics.length} conversation topics.`)

		if (topics.length > 0) {
			const client = await this.connectToApi()

			this.log.info('Unregistering past conversation topics.')

			const unregisterResults = await client.emit(
				'unregister-conversation-topics::v2020_12_25',
				{
					payload: { shouldUnregisterAll: true },
				}
			)

			eventResponseUtil.getFirstResponseOrThrow(unregisterResults)

			this.log.info(
				`Registering new ${topics.length} topic${
					topics.length === 1 ? '' : 's'
				}.`
			)

			const results = await client.emit(
				`register-conversation-topics::v2020_12_25`,
				{ payload: { topics: topics.map((topic) => ({ key: topic.key })) } }
			)

			eventResponseUtil.getFirstResponseOrThrow(results)

			this.log.info('Topics now in sync.')
		}
	}

	private async connectToApi<
		Contract extends EventContract = CoreEventContract
	>() {
		const events = this.skill.getFeatureByCode('event') as EventFeature

		const client = await events.connectToApi<Contract>()
		return client
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
		return this._isBooted
	}
}

export default (skill: Skill) => {
	const feature = new ConversationFeature(skill)
	skill.registerFeature('conversation', feature)
}
