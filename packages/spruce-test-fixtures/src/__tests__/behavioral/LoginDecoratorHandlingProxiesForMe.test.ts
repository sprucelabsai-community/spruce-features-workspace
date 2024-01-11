import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test-utils'
import ClientProxyDecorator from '../../ClientProxyDecorator'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import {
	DEMO_NUMBER_LOGIN_DECORATOR,
	DEMO_NUMBER_LOGIN_DECORATOR_2,
} from '../../tests/constants'
import login from '../../tests/decorators/login'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'

MercuryFixture.setShouldRequireLocalListeners(false)

@login(DEMO_NUMBER_LOGIN_DECORATOR)
export default class LoginDecoratorHandlingProxiesForMeTest extends AbstractSpruceFixtureTest {
	private static lastToken?: string

	@test('proxy set to random', `${Math.random() * new Date().getTime()}`)
	protected static async proxyTokenGeneratorReturnsExpectedProxyToken(
		expected: string
	) {
		await login.getClient().on('register-proxy-token::v2020_12_25', () => {
			return {
				token: expected,
			}
		})

		const token = await this.generateToken()

		assert.isEqual(token, expected)
	}

	@test()
	protected static async onlyEmitsEventOnce() {
		let hitCount = 0
		await login.getClient().on('register-proxy-token::v2020_12_25', () => {
			hitCount++
			return {
				token: 'aoeu',
			}
		})

		const generator = this.getDecorator().getProxyTokenGenerator()
		await generator?.()

		assert.isEqual(hitCount, 0)

		await generator?.()
		await generator?.()

		assert.isEqual(hitCount, 0)
	}

	@test()
	protected static async tokenSetBackAfterEachTest() {
		this.lastToken = await this.generateToken()

		await this.loginAsSecondPerson()

		const newToken = await this.generateToken()
		assert.isNotEqual(this.lastToken, newToken)
	}

	@test()
	protected static async tokenBackToOriginLoggedInPerson() {
		const token = await this.generateToken()
		assert.isEqual(this.lastToken, token)
	}

	@test()
	protected static async loggingAnAsDemoPerson2AgainSetsValidProxy() {
		const { client } = await this.loginAsSecondPerson()
		const token = await this.generateToken()

		const results = await client.emit('whoami::v2020_12_25', {
			source: {
				proxyToken: token,
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(results)
	}

	private static getDecorator() {
		return ClientProxyDecorator.getInstance()
	}

	private static async generateToken() {
		const generator = this.getDecorator().getProxyTokenGenerator()
		const token = await generator?.()
		return token
	}

	private static async loginAsSecondPerson() {
		return this.Fixture('view').loginAsDemoPerson(DEMO_NUMBER_LOGIN_DECORATOR_2)
	}
}
