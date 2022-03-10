import { MercuryTestClient } from '@sprucelabs/mercury-client'
import {
	eventAssertUtil,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest } from '../..'
import eventFaker from '../../tests/eventFaker'

export default class FakingErrorResponsesTest extends AbstractSpruceFixtureTest {
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

		await this.assertResponsIsFakeEventError(fqen, targetAndPayload)
	}

	@test()
	protected static async throwsEvenWhenFakingWithPreviousListeners() {
		const client = await this.connectToApi()

		//@ts-ignore
		await client.on('whoami::v2020_12_25', async () => {
			return {}
		})

		await eventFaker.makeEventThrow('whoami::v2020_12_25')
		await this.assertResponsIsFakeEventError('whoami::v2020_12_25')
	}

	@test()
	protected static async fakeEventsAreClearedFromPreviousTest() {
		const client = await this.connectToApi()

		await client.on('request-pin::v2020_12_25', async () => {
			return {
				challenge: 'aoeu',
			}
		})

		const results = await client.emit('request-pin::v2020_12_25', {
			payload: {
				phone: '+555-000-0001',
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(results)
	}

	@test()
	protected static async canFakeEventWithNoResponse() {
		const client = (await this.connectToApi()) as MercuryTestClient

		const fqen = 'test-burrito::v1'
		client.mixinContract({
			eventSignatures: {
				[fqen]: {
					isGlobal: true,
				},
			},
		})

		await eventFaker.handleReactiveEvent(fqen as any)

		const results = await client.emit(fqen)

		assert.isEqual(results.totalErrors, 0)
	}

	private static async assertResponsIsFakeEventError(
		fqen: any,
		targetAndPayload?: any
	) {
		const client = await this.connectToApi()

		const results = await client.emit(fqen, targetAndPayload)

		assert.isEqual(results.totalErrors, 1)

		eventAssertUtil.assertErrorFromResponse(results, 'FAKE_EVENT_ERROR', {
			fqen,
		})
	}

	private static async connectToApi() {
		const client = await this.mercury.connectToApi()
		return client
	}
}
