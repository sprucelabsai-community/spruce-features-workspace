import { coreEventContracts } from '@sprucelabs/mercury-core-events'
import { eventContractUtil } from '@sprucelabs/spruce-event-utils'
import { diskUtil, HASH_SPRUCE_BUILD_DIR } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import FixtureFactory from '../../tests/fixtures/FixtureFactory'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'

export default class MercuryFixtureTest extends AbstractSpruceFixtureTest {
	private static fixture: MercuryFixture

	protected static async beforeAll() {
		await super.beforeAll()
		MercuryFixture.beforeAll()
	}

	protected static async beforeEach() {
		await super.beforeEach()
		this.fixture = this.Fixture('mercury')
	}

	@test()
	protected static async hasDefaultContractByDefault() {
		const client = await this.fixture.connectToApi()

		//@ts-ignore
		assert.isTruthy(client.eventContract)

		//@ts-ignore
		assert.isEqual(client.eventContract, coreEventContracts[0])
	}

	@test()
	protected static async canCreateMercuryFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async returnsConnectedClient() {
		const client = await this.fixture.connectToApi()
		assert.isTrue(client.isConnected())
		await client.disconnect()
	}

	@test()
	protected static async returnsSameClientOnSecondConnect() {
		const client = await this.fixture.connectToApi()
		//@ts-ignore
		client.__monkeyPatch = true
		const client2 = await this.fixture.connectToApi()
		//@ts-ignore
		assert.isTrue(client2.__monkeyPatch)
		await client.disconnect()
		assert.isFalse(client2.isConnected())
	}

	@test('auto imports signature 1', [
		{
			eventSignatures: {
				['taco-bravo']: true,
			},
		},
	])
	@test('auto imports signature 2', [
		{
			eventSignatures: {
				['taco-bravo2']: true,
			},
		},
	])
	protected static async importsContractIfLocalOneIsGenerated(sigs: any[]) {
		this.cwd = diskUtil.createRandomTempDir()

		const destination = diskUtil.resolvePath(
			this.cwd,
			HASH_SPRUCE_BUILD_DIR,
			'events/events.contract.js'
		)

		const contents = `exports["default"] = ${JSON.stringify(sigs)};`

		diskUtil.writeFile(destination, contents)

		const client = await new FixtureFactory({ cwd: this.cwd })
			.Fixture('mercury')
			.connectToApi()

		//@ts-ignore
		assert.isTruthy(client.eventContract)

		assert.doesInclude(
			//@ts-ignore
			client.eventContract.eventSignatures,
			sigs[0].eventSignatures
		)

		//should never include core event contracts, those are added
		//to events.contract.ts
		assert.doesThrow(() =>
			eventContractUtil.getSignatureByName(
				//@ts-ignore
				client.eventContract,
				'set-role::v2020_12_25'
			)
		)
	}
}
