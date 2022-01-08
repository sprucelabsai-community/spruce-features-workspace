import { assert, test } from '@sprucelabs/test'
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
		prop: 'stores',
		privatePropName: '_stores',
		fixtureName: 'store',
		instanceOf: StoreFixture,
	},
]

export default class ResettingFixtureFieldsBeforeEachTest extends AbstractSpruceFixtureTest {
	@test()
	protected static shouldBeAbleToGetAllFixtures() {
		for (const check of toCheck) {
			//@ts-ignore
			const fixture = this[check.prop]

			assert.isTruthy(fixture)

			const local = this.getPrivateProp(check)

			assert.isTruthy(local, `Did not set this.${check.privatePropName}`)

			assert.isEqual(fixture, local)
		}
	}

	private static getPrivateProp(check: { privatePropName: string }) {
		//@ts-ignore
		return this[check.privatePropName]
	}

	@test()
	protected static async privatePropsNotSetAtFirst() {
		for (const check of toCheck) {
			assert.isFalsy(this.getPrivateProp(check))
		}
	}

	@test()
	protected static async canSetEachPrivateProp() {
		for (const check of toCheck) {
			//@ts-ignore
			this[check.prop] = this.Fixture(check.fixtureName)
		}
	}
}
