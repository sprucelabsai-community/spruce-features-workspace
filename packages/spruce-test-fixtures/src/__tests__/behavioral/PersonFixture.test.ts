import { formatPhoneNumber } from '@sprucelabs/schema'
import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import dotenv from 'dotenv'
import { DEMO_NUMBER_SECOND_LOGIN, DEMO_NUMBER } from '../../tests/constants'
import FixtureFactory from '../../tests/fixtures/FixtureFactory'
import PersonFixture from '../../tests/fixtures/PersonFixture'
dotenv.config()

export default class PersonFixtureTest extends AbstractSpruceTest {
	private static fixture: PersonFixture

	protected static async beforeEach() {
		await super.beforeEach()

		this.fixture = new FixtureFactory({ cwd: this.cwd }).Fixture('person')
	}

	@test()
	protected static async canCreatePersonFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async throwsWhenNoDummyNumberSetInEnv() {
		delete process.env.DEMO_NUMBER

		const err = await assert.doesThrowAsync(() =>
			this.fixture.loginAsDemoPerson()
		)
		errorAssertUtil.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['env.DEMO_NUMBER'],
		})
	}

	@test()
	protected static async canLoginAsPerson() {
		const { person, client } = await this.fixture.loginAsDemoPerson(DEMO_NUMBER)

		assert.isTruthy(person)
		assert.isTruthy(client)

		await client.disconnect()
	}

	@test()
	protected static async canLoginAsPersonWithEnv() {
		process.env.DEMO_NUMBER = DEMO_NUMBER
		const { person, client } = await this.fixture.loginAsDemoPerson()

		assert.isTruthy(person)
		assert.isEqual(person.phone, formatPhoneNumber(DEMO_NUMBER))
		assert.isTruthy(client)

		await client.disconnect()
	}

	@test()
	protected static async canLoginWith2Numbers() {
		const { person } = await this.fixture.loginAsDemoPerson()

		const { person: person2 } = await this.fixture.loginAsDemoPerson(
			DEMO_NUMBER_SECOND_LOGIN
		)

		assert.isEqual(person.phone, formatPhoneNumber(DEMO_NUMBER))
		assert.isEqual(person2.phone, formatPhoneNumber(DEMO_NUMBER_SECOND_LOGIN))
	}
}
