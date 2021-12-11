import { eventAssertUtil } from '@sprucelabs/spruce-event-utils'
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
		const mercuryFixture = this.Fixture('mercury')

		await eventMocker.makeEventThrow(mercuryFixture, fqen)

		const client = await mercuryFixture.connectToApi()

		const results = await client.emit(fqen, targetAndPayload)

		assert.isEqual(results.totalErrors, 1)

		eventAssertUtil.assertErrorFromResponse(results, 'MOCK_EVENT_ERROR', {
			fqen,
		})
	}
}
