import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert, test } from '@sprucelabs/test-utils'
import { AbstractSpruceFixtureTest, login, seed } from '../..'
import { DEMO_NUMBER_ACCOUNT_BEFORE_ALL_RESET_LOCATION } from '../../tests/constants'

@login(DEMO_NUMBER_ACCOUNT_BEFORE_ALL_RESET_LOCATION)
export default class ResettingAccountBeforeAllTestsTest extends AbstractSpruceFixtureTest {
	protected static async beforeAll() {
		await super.beforeAll()

		const { client } = await this.people.loginAsDemoPerson(
			DEMO_NUMBER_ACCOUNT_BEFORE_ALL_RESET_LOCATION
		)

		const orgResults = await client.emit('create-organization::v2020_12_25', {
			payload: {
				name: 'Test',
			},
		})

		const { organization } =
			eventResponseUtil.getFirstResponseOrThrow(orgResults)

		//@ts-ignore
		await client.emit('create-location::v2020_12_25', {
			target: {
				organizationId: organization.id,
			},
			payload: {
				name: 'a location',
				address: {},
			},
		})
	}

	@test()
	protected static async delayToGivesSeederTimeToWrite() {
		await this.wait(4000)
	}

	@test()
	protected static async shouldHaveNoLocations() {
		await assert.doesThrowAsync(() => this.listLocations())
	}

	@test()
	@seed('locations', 1)
	protected static async nothing() {}

	private static async listLocations() {
		return await this.locations.listLocations()
	}
}

//@ts-ignore
ResettingAccountBeforeAllTestsTest.cwd = process.cwd()
