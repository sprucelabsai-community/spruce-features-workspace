import { coreEventContracts } from '@sprucelabs/mercury-types'
import { diskUtil, HASH_SPRUCE_BUILD_DIR } from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import FixtureFactory from '../../tests/fixtures/FixtureFactory'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'

export default class MercuryFixtureTest extends AbstractSpruceTest {
	private static fixture: MercuryFixture

	protected static async beforeAll() {
		await super.beforeAll()
		MercuryFixture.beforeAll()
	}

	protected static async beforeEach() {
		await super.beforeEach()
		MercuryFixture.beforeEach()
		this.fixture = new FixtureFactory({ cwd: this.cwd }).Fixture('mercury')
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

		MercuryFixture.beforeAll()

		const client = await new FixtureFactory({ cwd: this.cwd })
			.Fixture('mercury')
			.connectToApi()

		//@ts-ignore
		assert.isTruthy(client.eventContract)

		assert.isEqualDeep(
			//@ts-ignore
			client.eventContract.eventSignatures,
			sigs[0].eventSignatures
		)
	}
}
