import { MercuryClient } from '@sprucelabs/mercury-client'
import { CoreEventContract } from '@sprucelabs/mercury-types'
import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import AbstractConversationTest from '../../tests/AbstractConversationTest'

export default class RespondingToMessagesTest extends AbstractConversationTest {
	private static client: MercuryClient<CoreEventContract>

	protected static async beforeEach() {
		await super.beforeEach()
		//@ts-ignore
		this.client = undefined
	}

	@test()
	protected static async respondsToFirstMessageWithSuggestedTopics() {
		this.cwd = this.resolveTestPath('skill')
		const results = await this.sendMessage()

		const { suggestedTopics } = eventResponseUtil.getFirstResponseOrThrow(
			results
		)

		assert.isArray(suggestedTopics)
		assert.isLength(suggestedTopics, 1)
	}

	@test()
	protected static async scriptSendsMessages() {
		this.cwd = this.resolveTestPath('skill')

		const sentMessages: any[] = []

		await this.boot()

		await this.client.on(
			'send-message::v2020_12_25',
			async (targetAndPayload) => {
				const { payload } = targetAndPayload
				sentMessages.push(payload.message)
				return { message: payload.message } as any
			}
		)

		await this.sendMessage({ topic: 'bookAppointment' })

		assert.isLength(sentMessages, 2)
	}

	private static async sendMessage(options?: {
		message?: any
		topic?: string
	}) {
		const client = await this.boot()

		const results = await client.emit('did-message::v2020_12_25', {
			target: {},
			payload: {
				...options,
				message: this.buildMessage({
					body: 'I wanna book an appointment!',
					source: {
						isCore: null,
						personId: '12345',
					},
					...options?.message,
				}),
			},
		})

		return results
	}

	private static async boot() {
		if (!this.client) {
			const { skill } = await this.bootAndRegisterSkill({
				name: 'my skill yo',
			})

			const events = skill.getFeatureByCode('event') as EventFeature
			const client = await events.connectToApi<CoreEventContract>()

			this.client = client
		}

		return this.client
	}
}
