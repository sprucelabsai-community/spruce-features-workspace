import { test, assert } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest, login } from '../..'
import ClientProxyDecorator from '../../ClientProxyDecorator'
import { DEMO_NUMBER } from '../../tests/constants'

@login(DEMO_NUMBER)
export default class DecoratoringEmitToPassThroughProxyTest extends AbstractSpruceFixtureTest {
	private static lastInstance: ClientProxyDecorator

	@test()
	protected static sharesInstance() {
		const instance = this.getDecorator()
		assert.isEqual(instance, ClientProxyDecorator.getInstance())
	}

	@test()
	protected static canClearIsntance() {
		const instance = this.getDecorator()
		ClientProxyDecorator.clearInstance()
		assert.isNotEqual(instance, this.getDecorator())
	}

	@test()
	protected static canGetAndSetProxyGenerator() {
		const instance = this.getDecorator()
		const cb = async () => '12345'

		instance.setProxyTokenGenerator(cb)
		assert.isEqual(instance.getProxyTokenGenerator(), cb)
	}

	@test('can set token to 234', '234')
	@test('can set token to aoeuaoeu', 'aoeuaoeu')
	protected static async canSetDefaultProxyPassThrough(id: string) {
		const instance = this.getDecorator()
		instance.setProxyTokenGenerator(async () => id)

		const client = instance.decorateEmitToPassProxyToken(login.getClient())

		await this.assertProxyEquals(client, id)
	}

	@test()
	protected static async canSetTokenWhileDecorating() {
		const instance = this.getDecorator()
		const client = instance.decorateEmitToPassProxyToken(
			login.getClient(),
			'123'
		)

		await this.assertProxyEquals(client, '123')

		this.lastInstance = this.getDecorator()
	}

	@test()
	protected static async instanceIsSameEachTest() {
		assert.isEqual(this.lastInstance, this.getDecorator())
	}

	@test()
	protected static async loginSetsUpProxyTokenGenerator() {
		const generator = this.getDecorator().getProxyTokenGenerator()
		assert.isTruthy(generator)
	}

	private static async assertProxyEquals(client: any, id: string) {
		let passedSource: any

		//@ts-ignore
		await client.on('whoami::v2020_12_25', ({ source }) => {
			passedSource = source
			return {} as any
		})

		await client.emit('whoami::v2020_12_25')

		assert.isEqual(passedSource.proxyToken, id)
	}

	private static getDecorator() {
		return ClientProxyDecorator.getInstance()
	}
}
