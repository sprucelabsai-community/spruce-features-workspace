import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import dotenv from 'dotenv'
import FixtureFactory from '../../tests/fixtures/FixtureFactory'
import PersonFixture from '../../tests/fixtures/PersonFixture'
dotenv.config()

const DEMO_NUMBER = process.env.DEMO_NUMBER

export default class PersonFixtureTest extends AbstractSpruceTest {
	private static fixture: PersonFixture

	protected static async beforeEach() {
		await super.beforeEach()

		this.fixture = FixtureFactory.Fixture('person')
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
		assert.isTruthy(client)

		await client.disconnect()
	}
}
