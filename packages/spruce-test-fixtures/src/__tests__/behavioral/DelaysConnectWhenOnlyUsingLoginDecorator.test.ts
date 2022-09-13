import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { assert, test } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER } from '../../tests/constants'
import fake from '../../tests/decorators/fake'

process.env.SKILL_ID = 'yay'
process.env.SKILL_API_KEY = 'yay'

@fake.login(DEMO_NUMBER)
export default class DelaysConnectWhenOnlyUsingLoginDecoratorTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async globalEmitterListeningToAuthenticate() {
		const emitter = MercuryTestClient.getInternalEmitter({
			eventSignatures: {},
		})

		//@ts-ignore
		assert.isTruthy(emitter.listenersByEvent['authenticate::v2020_12_25'])
	}
}
