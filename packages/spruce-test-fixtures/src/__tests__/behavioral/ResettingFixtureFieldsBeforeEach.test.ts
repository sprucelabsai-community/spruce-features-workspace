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
	{ prop: 'views', privatePropName: '_views', instanceOf: ViewFixture },
	{ prop: 'roles', privatePropName: '_roles', instanceOf: RoleFixture },
	{
		prop: 'locations',
		privatePropName: '_locations',
		instanceOf: LocationFixture,
	},
	{
		prop: 'organizations',
		privatePropName: '_organizations',
		instanceOf: OrganizationFixture,
	},
	{ prop: 'people', privatePropName: '_people', instanceOf: PersonFixture },
	{ prop: 'seeder', privatePropName: '_seeder', instanceOf: SeedFixture },
	{ prop: 'skills', privatePropName: '_skills', instanceOf: SkillFixture },
	{ prop: 'mercury', privatePropName: '_mercury', instanceOf: MercuryFixture },
	{ prop: 'stores', privatePropName: '_stores', instanceOf: StoreFixture },
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
}
