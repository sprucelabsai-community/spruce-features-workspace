import { test, assert } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest, login } from '../..'
import ClientProxyDecorator from '../../ClientProxyDecorator'
import { DEMO_NUMBER } from '../../tests/constants'

@login(DEMO_NUMBER)
export default class LoginDecoratorHandlingProxiesForMeTest extends AbstractSpruceFixtureTest {
	@test('proxy set to random', `${Math.random() * new Date().getTime()}`)
	protected static async proxyTokenGeneratorReturnsExpectedProxyToken(
		expected: string
	) {
		await login.getClient().on('register-proxy-token::v2020_12_25', () => {
			return {
				token: expected,
			}
		})

		const generator = this.getDecorator().getProxyTokenGenerator()
		const token = await generator?.()

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

	private static getDecorator() {
		return ClientProxyDecorator.getInstance()
	}
}
