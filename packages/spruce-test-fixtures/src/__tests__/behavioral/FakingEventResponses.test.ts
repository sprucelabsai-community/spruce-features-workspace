import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { eventAssertUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test-utils'
import { AbstractSpruceFixtureTest } from '../..'
import SpruceError from '../../errors/SpruceError'
import eventFaker from '../../tests/eventFaker'

export default class FakingErrorResponsesTest extends AbstractSpruceFixtureTest {
	private static client: MercuryTestClient
	protected static async beforeEach() {
		await super.beforeEach()
		this.client = (await this.mercury.connectToApi()) as MercuryTestClient
	}

	@test('faking whoami::v2020_12_25', 'whoami::v2020_12_25')
	@test('faking request-pin::v2020_12_25', 'request-pin::v2020_12_25', {
		payload: {
			phone: '+555-000-0001',
		},
	})
	protected static async throwsWhenFakingResponse(
		fqen: any,
		targetAndPayload: any
	) {
		await eventFaker.makeEventThrow(fqen)
		await this.assertResponseIsFakeEventError(fqen, targetAndPayload)
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

		//@ts-ignore
		await eventFaker.on(fqen, () => {
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
	protected static async throwsEvenWhenFakingWithPreviousListeners() {
		//@ts-ignore
		await this.client.on('whoami::v2020_12_25', async () => {
			return {}
		})

		await eventFaker.makeEventThrow('whoami::v2020_12_25')
		await this.assertResponseIsFakeEventError('whoami::v2020_12_25')
	}

	@test()
	protected static async fakeEventsAreClearedFromPreviousTest() {
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
	protected static async canFakeEventWithNoResponse() {
		const fqen = 'test-burrito::v1'
		this.client.mixinContract({
			eventSignatures: {
				[fqen]: {
					isGlobal: true,
				},
			},
		})

		await eventFaker.handleReactiveEvent(fqen as any)

		const results = await this.client.emit(fqen)

		assert.isEqual(results.totalErrors, 0)
	}

	@test()
	protected static async canCustomizeTheErrorPassedIn() {
		const error = new SpruceError({
			code: 'INVALID_TARGET',
		})
		await eventFaker.makeEventThrow('whoami::v2020_12_25', error)

		const results = await this.client.emit('whoami::v2020_12_25')
		assert.isEqualDeep(results.responses[0].errors?.[0], error)
	}

	private static async assertResponseIsFakeEventError(
		fqen: any,
		targetAndPayload?: any
	) {
		const results = await this.client.emit(fqen, targetAndPayload)

		assert.isEqual(results.totalErrors, 1)

		eventAssertUtil.assertErrorFromResponse(results, 'FAKE_EVENT_ERROR', {
			fqen,
		})
	}
}
