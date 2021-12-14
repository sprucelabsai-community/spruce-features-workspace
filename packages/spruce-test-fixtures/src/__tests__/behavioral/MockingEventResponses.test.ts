import {
	eventAssertUtil,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest } from '../..'
import eventMocker from '../../tests/eventMocker'

export default class MockingErrorResponsesTest extends AbstractSpruceFixtureTest {
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

		const client = await this.connectToApi()

		const results = await client.emit(fqen, targetAndPayload)

		assert.isEqual(results.totalErrors, 1)

		eventAssertUtil.assertErrorFromResponse(results, 'MOCK_EVENT_ERROR', {
			fqen,
		})
	}

	@test()
	protected static async mockEventsAreClearedFromPreviousTest() {
		const client = await this.Fixture('mercury').connectToApi()

		await client.on('request-pin::v2020_12_25', async () => {
			return {
				auth: {},
				challenge: 'aoeu',
				type: 'authenticated' as any,
			}
		})

		const results = await client.emit('request-pin::v2020_12_25', {
			payload: {
				phone: '+555-000-0001',
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(results)
	}

	private static async connectToApi() {
		const mercuryFixture = this.Fixture('mercury')

		const client = await mercuryFixture.connectToApi()
		return client
	}
}
