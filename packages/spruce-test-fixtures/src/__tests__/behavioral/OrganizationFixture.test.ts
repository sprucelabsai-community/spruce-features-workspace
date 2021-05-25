import { eventErrorAssertUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import OrganizationFixture from '../../fixtures/OrganizationFixture'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'

export default class OrganizationFixtureTest extends AbstractSpruceFixtureTest {
	private static fixture: OrganizationFixture

	protected static async beforeEach() {
		await super.beforeEach()
		this.fixture = this.Fixture('organization')
	}

	@test()
	protected static async canCreateOrganizationFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async canSeedOrg() {
		const org = await this.fixture.seedDemoOrg({ name: 'my org' })
		assert.isTruthy(org)
		assert.isEqual(org.name, 'my org')
	}

	@test()
	protected static async orgFixtureDestroysOrgs() {
		const org = await this.fixture.seedDemoOrg({ name: 'my org' })
		await this.fixture.destory()
		await this.fixture.destory()

		const client = await this.Fixture('mercury').connectToApi()
		const results = await client.emit('get-organization::v2020_12_25', {
			target: {
				organizationId: org.id,
			},
		})

		eventErrorAssertUtil.assertErrorFromResponse(results, 'INVALID_TARGET')
	}

	@test()
	protected static async isNotPartOfOrgtoStart() {
		const people = this.Fixture('person')
		const org = await this.fixture.seedDemoOrg({ name: 'my org' })

		const { person } = await people.loginAsDemoPerson(
			process.env.DEMO_NUMBER_HIRING
		)

		const isHired = await this.fixture.isPartOfOrg(person.id, org.id)
		assert.isFalse(isHired)
	}

	@test()
	protected static async canAttachPersonToOrg() {
		const people = this.Fixture('person')
		const org = await this.fixture.seedDemoOrg({ name: 'my org' })

		const { person } = await people.loginAsDemoPerson(
			process.env.DEMO_NUMBER_HIRING
		)

		await this.fixture.addPerson({
			personId: person.id,
			organizationId: org.id,
			roleBase: 'guest',
		})

		const isHired = await this.fixture.isPartOfOrg(person.id, org.id)
		assert.isTrue(isHired)
	}
}
