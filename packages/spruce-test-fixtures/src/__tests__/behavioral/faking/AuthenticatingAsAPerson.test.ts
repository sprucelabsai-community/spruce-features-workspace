import { eventAssertUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'

@fake.login()
export default class AuthenticatingAsAPersonTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async throwsWithBadToken() {
		const err = await assert.doesThrowAsync(() =>
			fake.getClient().authenticate({ token: 'aoeuaou' })
		)
		eventAssertUtil.assertError(err, 'INVALID_AUTH_TOKEN')
	}

	@test()
	protected static async canAuthenticateAsAPerson() {
		const { token, person } = await this.people.loginAsDemoPerson()
		const { person: person2 } = await fake.getClient().authenticate({ token })

		assert.isEqualDeep(person, person2)
	}

	@test()
	protected static async authReturnsExpectedPerson() {
		await this.people.loginAsDemoPerson()
		const { token, person } = await this.people.loginAsDemoPerson(
			'555-111-1234'
		)
		const { person: person2 } = await fake.getClient().authenticate({ token })

		assert.isEqualDeep(person, person2)
	}

	@test()
	protected static async tokenAlwaysDifferent() {
		const { token: token1 } = await this.people.loginAsDemoPerson()
		const { token: token2 } = await this.people.loginAsDemoPerson(
			'555-111-1234'
		)

		assert.isNotEqual(token1, token2)
	}
}
