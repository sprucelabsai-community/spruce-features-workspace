import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { EventNames } from '@sprucelabs/mercury-types'
import { eventAssertUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest } from '../..'
import eventMocker from '../../tests/eventMocker'

export default class MockingErrorResponsesTest extends AbstractSpruceFixtureTest {
	private static client: MercuryTestClient
	protected static async beforeEach() {
		await super.beforeEach()
		this.client = (await this.mercury.connectToApi()) as MercuryTestClient
	}

	@test('mocking whoami::v2020_12_25', 'whoami::v2020_12_25')
	@test('mocking request-pin::v2020_12_25', 'request-pin::v2020_12_25', {
		payload: {
			phone: '+555-000-0001',
		},
	})
	protected static async throwsWhenMockingResponse(
		fqen: any,
		targetAndPayload: any
	) {
		await eventMocker.makeEventThrow(fqen)
		await this.assertResponseIsMockError(fqen, targetAndPayload)
	}

	@test('on clears previous listeners 1', 'whoami::v2020_12_25')
	@test('on clears previous listeners 2', 'what-the::v2020_12_25')
	protected static async onClearsPreviousListeners(fqen: any) {
		let wasOldHit = false
		let wasNewHit = false

		if (!this.client.doesHandleEvent(fqen)) {
			this.client.mixinContract({
				eventSignatures: {
					[fqen]: {},
				},
			})
		}

		await this.client.on(fqen, () => {
			wasOldHit = true
		})

		await eventMocker.on(fqen, () => {
			wasNewHit = true

			return {
				auth: {},
				type: 'anonymous' as const,
			}
		})

		assert.isFalse(wasNewHit)

		await this.client.emit(fqen)

		assert.isFalse(wasOldHit)
		assert.isTrue(wasNewHit)
	}

	@test()
	protected static async throwsEvenWhenMockingWithPreviousListeners() {
		//@ts-ignore
		await this.client.on('whoami::v2020_12_25', async () => {
			return {}
		})

		await eventMocker.makeEventThrow('whoami::v2020_12_25')
		await this.assertResponseIsMockError('whoami::v2020_12_25')
	}

	@test()
	protected static async mockEventsAreClearedFromPreviousTest() {
		await this.client.on('request-pin::v2020_12_25', async () => {
			return {
				challenge: 'aoeu',
			}
		})

		await this.client.emitAndFlattenResponses('request-pin::v2020_12_25', {
			payload: {
				phone: '+555-000-0001',
			},
		})
	}

	@test()
	protected static async canMockEventWithNoResponse() {
		const fqen = 'test-burrito::v1'
		this.client.mixinContract({
			eventSignatures: {
				[fqen]: {
					isGlobal: true,
				},
			},
		})

		await eventMocker.handleReactiveEvent(fqen as any)

		const results = await this.client.emit(fqen)

		assert.isEqual(results.totalErrors, 0)
	}

	private static async assertResponseIsMockError(
		fqen: any,
		targetAndPayload?: any
	) {
		const results = await this.client.emit(fqen, targetAndPayload)

		assert.isEqual(results.totalErrors, 1)

		eventAssertUtil.assertErrorFromResponse(results, 'MOCK_EVENT_ERROR', {
			fqen,
		})
	}
}
