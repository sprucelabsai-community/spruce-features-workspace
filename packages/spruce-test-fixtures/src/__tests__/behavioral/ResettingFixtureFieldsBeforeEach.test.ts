import { DatabaseFixture } from '@sprucelabs/data-stores'
import { assert, test } from '@sprucelabs/test-utils'
import {
	AbstractSpruceFixtureTest,
	LocationFixture,
	MercuryFixture,
	OrganizationFixture,
	PersonFixture,
	RoleFixture,
	SkillFixture,
	StoreFixture,
	ViewFixture,
} from '../..'
import PermissionFixture from '../../tests/fixtures/PermissionFixture'
import SeedFixture from '../../tests/fixtures/SeedFixture'

const toCheck = [
	{
		prop: 'views',
		privatePropName: '_views',
		fixtureName: 'view',
		instanceOf: ViewFixture,
	},
	{
		prop: 'roles',
		privatePropName: '_roles',
		fixtureName: 'role',
		instanceOf: RoleFixture,
	},
	{
		prop: 'locations',
		privatePropName: '_locations',
		fixtureName: 'location',
		instanceOf: LocationFixture,
	},
	{
		prop: 'organizations',
		privatePropName: '_organizations',
		fixtureName: 'organization',
		instanceOf: OrganizationFixture,
	},
	{
		prop: 'people',
		privatePropName: '_people',
		fixtureName: 'person',
		instanceOf: PersonFixture,
	},
	{
		prop: 'seeder',
		privatePropName: '_seeder',
		fixtureName: 'seed',
		instanceOf: SeedFixture,
	},
	{
		prop: 'skills',
		privatePropName: '_skills',
		fixtureName: 'skill',
		instanceOf: SkillFixture,
	},
	{
		prop: 'mercury',
		privatePropName: '_mercury',
		fixtureName: 'mercury',
		instanceOf: MercuryFixture,
	},
	{
		prop: 'database',
		privatePropName: '_database',
		fixtureName: 'database',
		instanceOf: DatabaseFixture,
	},
	{
		prop: 'stores',
		privatePropName: '_stores',
		fixtureName: 'store',
		instanceOf: StoreFixture,
	},
	{
		prop: 'permissions',
		privatePropName: '_permissions',
		fixtureName: 'permission',
		instanceOf: PermissionFixture,
	},
]

export default class ResettingFixtureFieldsBeforeEachTest extends AbstractSpruceFixtureTest {
	@test()
	protected static shouldBeAbleToGetAllFixtures() {
		for (const check of toCheck) {
			const fixture = this.getFixture(check)

			assert.isTruthy(fixture, `No fixture found for ${check.fixtureName}`)

			const local = this.getPrivateProp(check)

			assert.isTruthy(local, `Did not set this.${check.privatePropName}`)

			assert.isEqual(fixture, local)
		}
	}

	@test()
	protected static async privatePropsNotSetAtFirst() {
		this.assertLocalPropsAreCleared()
	}

	@test()
	protected static async canSetEachPrivateProp() {
		for (const check of toCheck) {
			//@ts-ignore
			this[check.prop] = this.Fixture(check.fixtureName)
		}
	}

	@test()
	protected static async afterEachClearsLocalProps() {
		for (const check of toCheck) {
			this.getFixture(check)
		}

		await this.afterEach()

		this.assertLocalPropsAreCleared()
	}

	private static assertLocalPropsAreCleared() {
		for (const check of toCheck) {
			assert.isFalsy(this.getPrivateProp(check))
		}
	}

	private static getFixture(check: (typeof toCheck)[number]) {
		//@ts-ignore
		return this[check.prop]
	}

	private static getPrivateProp(check: { privatePropName: string }) {
		//@ts-ignore
		return this[check.privatePropName]
	}
}
