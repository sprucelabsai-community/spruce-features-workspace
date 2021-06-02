import { MercuryClient } from '@sprucelabs/mercury-client'
import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { Log, Skill, SkillFeature } from '@sprucelabs/spruce-skill-utils'
import { ConversationCoordinator } from '../conversations/ConversationCoordinator'
import SpruceError from '../errors/SpruceError'
import ScriptTester from '../tests/ScriptTester'
import TopicLoader from '../topics/TopicLoader'
import {
	ConversationHealthCheckItem,
	LoadedTopicDefinition,
} from '../types/conversation.types'

export class ConversationFeature implements SkillFeature {
	private skill: Skill
	private log: Log
	private isExecuting = false
	private _isBooted = false
	private executeResolver?: any
	private _isTesting = false
	private executeRejector?: (err: any) => void
	private coordinatorsBySource: Record<string, any> = {}

	public constructor(skill: Skill) {
		this.skill = skill
		this.log = skill.buildLog('Conversation.Feature')
	}

	public async execute(): Promise<void> {
		this.assertDependencies()
		this.isExecuting = true

		try {
			if (process.env.ACTION === 'test.conversation') {
				this._isTesting = true
				const topics = await this.loadTopics()

				if (topics.length === 0) {
					this.log.info('No Topics found to test. Testing cancelled...')
				} else {
					void this.startScriptTester(topics)
				}
			} else {
				await this.syncTopics()

				const client = await this.connectToApi()
				await this.startConversationCoordinator(client as any)

				this.log.info('Conversations loaded. Ready to chat when you are. 🤘')
			}
		} finally {
			this.isExecuting = false
			this._isBooted = true
		}

		await new Promise((resolve, reject) => {
			this.executeResolver = resolve
			this.executeRejector = reject
		})
	}

	private async loadTopics() {
		const topics = await TopicLoader.loadTopics(this.skill.activeDir)

		return topics
	}

	private async startScriptTester(topics: LoadedTopicDefinition[]) {
		this.log.info(
			`Found ${topics.length} topic${
				topics.length ? '' : 's'
			}. Holding for a second to let your skill finish building...`
		)

		this.log.info('Booting conversation tester.')

		const tester = await ScriptTester.Tester({ topics })

		while (!this.skill.isBooted()) {
			await new Promise((resolve) => setTimeout(resolve, 10))
		}

		console.clear()

		void tester.go(process.env.FIRST_MESSAGE).catch((err) => {
			this.executeRejector?.(
				new SpruceError({ code: 'CONVERSATION_ABORTED', originalError: err })
			)
		})
	}

	private async startConversationCoordinator(client: MercuryClient) {
		await client.on('did-message::v2020_12_25', async (targetAndPayload) => {
			const { message, topic } = targetAndPayload.payload
			const coordinator = await this.getCoordinatorForPerson(
				client,
				message.source.personId ?? '***missing***'
			)

			return coordinator.handleMessage(message, topic)
		})
	}

	private async getCoordinatorForPerson(client: any, sourceId: string) {
		if (this.coordinatorsBySource[sourceId]) {
			return this.coordinatorsBySource[sourceId]
		}

		this.coordinatorsBySource[sourceId] = ConversationCoordinator.Coordinator({
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

		return this.coordinatorsBySource[sourceId]
	}

	private async syncTopics() {
		const topics = await TopicLoader.loadTopics(this.skill.activeDir)

		this.log.info(`Found ${topics.length} conversation topics.`)

		const client = await this.connectToApi()

		this.log.info('Unregistering all past conversation topics.')

		const unregisterResults = await client.emit(
			'unregister-conversation-topics::v2020_12_25',
			{
				payload: { shouldUnregisterAll: true },
			}
		)

		eventResponseUtil.getFirstResponseOrThrow(unregisterResults)

		if (topics.length > 0) {
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

	private async connectToApi() {
		const events = this.skill.getFeatureByCode('event') as EventFeature

		const client = await events.connectToApi()
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
		this._isTesting = false
		this.executeResolver?.()
		this.executeResolver = undefined

		while (this.isExecuting) {
			await new Promise((resolve) => setTimeout(resolve, 250))
		}
	}

	public isBooted() {
		return this._isBooted
	}

	public isTesting() {
		return this._isTesting
	}
}

export default (skill: Skill) => {
	const feature = new ConversationFeature(skill)
	skill.registerFeature('conversation', feature)
}
