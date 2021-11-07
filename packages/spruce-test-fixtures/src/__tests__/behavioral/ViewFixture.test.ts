import { AuthenticatorImpl } from '@sprucelabs/heartwood-view-controllers'
import { formatPhoneNumber } from '@sprucelabs/schema'
import { assert, test } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest } from '../..'

export default class StoreFixtureTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async canLogin() {
		const auth = AuthenticatorImpl.getInstance()
		assert.isFalsy(auth.getPerson())

		const { person } = await this.Fixture('view').loginAsDemoPerson(
			process.env.DEMO_NUMBER as string
		)

		const loggedIn = auth.getPerson()

		assert.isTruthy(loggedIn)
		assert.isEqualDeep(loggedIn, person)
	}

	@test()
	protected static async loginFallsBackToDemoNumber() {
		const { person } = await this.Fixture('view').loginAsDemoPerson()
		assert.isEqual(
			person.phone,
			formatPhoneNumber(process.env.DEMO_NUMBER ?? '')
		)
	}

	@test()
	protected static async canSetHeartwoodRoot() {
		const fixture = this.Fixture('view', {
			controllerMap: {
				'heartwood.root': true,
			},
		})

		const factory = fixture.getFactory()

		//@ts-ignore
		assert.isTrue(factory.controllerMap['heartwood.root'])
	}

	@test()
	protected static fixturesShouldShareConnectToApiReferences() {
		const fixture1 = this.Fixture('view')
		const fixture2 = this.Fixture('view')

		//@ts-ignore
		assert.isEqual(fixture1.connectToApi, fixture2.connectToApi)
	}

	@test()
	protected static canPassThroughPersonFixture() {
		const personFixture = this.Fixture('person')
		const viewFixture = this.Fixture('view', { personFixture })

		//@ts-ignore
		assert.isEqual(viewFixture.personFixture, personFixture)
	}
}
