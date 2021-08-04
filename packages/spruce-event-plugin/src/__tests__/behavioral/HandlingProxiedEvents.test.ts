import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { MercuryFixture } from '@sprucelabs/spruce-test-fixtures'
import { test, assert } from '@sprucelabs/test'
import { EventFeature } from '../..'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class HandlingProxiedEventsTest extends AbstractEventPluginTest {
	protected static async beforeEach() {
		await super.beforeEach()
		this.cwd = await this.generateSkillFromTestPath('registered-skill-proxied')
		MercuryFixture.setShouldMixinCoreEventContractsWhenImportingLocal(true)
	}

	@test()
	protected static async passesThroughProxyToken() {
		const { fqen, currentSkill, events } =
			await this.EventFixture().registerSkillAndSetupListeners()

		await this.bootSkill({ skill: currentSkill })

		const { client } = await this.Fixture('person').loginAsDemoPerson()

		const proxyToken = `${Math.random()}`

		await client.emit('register-proxy-token::v2020_12_25', {
			payload: {
				token: proxyToken,
			},
		})

		client.setProxyToken(proxyToken)

		//@ts-ignore
		client.mixinContract({
			eventSignatures: { 'test-proxied-event::v1': {} },
		})

		let passedSource: any

		//@ts-ignore
		await client.on('test-proxied-event::v1', ({ source }) => {
			passedSource = source
		})

		const results = await client.emit(fqen as any, {
			target: {
				organizationId: 'aoeu',
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isEqual(passedSource.proxyToken, proxyToken)

		await this.assertPrimaryMercuryClientDoesNotHaveProxyTokenSet(events)
	}

	private static async assertPrimaryMercuryClientDoesNotHaveProxyTokenSet(
		events: EventFeature
	) {
		const c = await events.connectToApi()

		//@ts-ignore
		assert.isFalsy(c.getProxyToken())
	}
}
