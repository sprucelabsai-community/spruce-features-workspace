import {
	MercuryConnectFactory,
	MercuryTestClient,
	connectionStatusContract,
} from '@sprucelabs/mercury-client'
import { coreEventContracts } from '@sprucelabs/mercury-core-events'
import { eventContractUtil } from '@sprucelabs/spruce-event-utils'
import { diskUtil, HASH_SPRUCE_BUILD_DIR } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test-utils'
import { TestConnectFactory, TestConnectionOptions } from '../..'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import FixtureFactory from '../../tests/fixtures/FixtureFactory'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'

export default class MercuryFixtureTest extends AbstractSpruceFixtureTest {
	private static fixture: MercuryFixture

	protected static async beforeEach() {
		await super.beforeEach()
		this.fixture = this.Fixture('mercury')
	}

	@test()
	protected static async hasDefaultContractByDefault() {
		const client = await this.fixture.connectToApi()

		//@ts-ignore
		assert.isTruthy(client.eventContract)

		const mixed = eventContractUtil.unifyContracts([
			coreEventContracts[0],
			connectionStatusContract,
		])

		assert.doesInclude(
			//@ts-ignore
			client.eventContract,
			mixed
		)
	}

	@test()
	protected static async canGetMoreThanOneClient() {
		await this.fixture.connectToApi({ shouldReUseClient: false })
		await this.fixture.connectToApi({ shouldReUseClient: false })
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
		this.createDirWriteContractFileAndSetCwd(sigs)

		const client = await this.connectToApi()

		//@ts-ignore
		assert.isTruthy(client.eventContract)

		assert.doesInclude(
			//@ts-ignore
			client.eventContract.eventSignatures,
			sigs[0].eventSignatures
		)

		eventContractUtil.getSignatureByName(
			//@ts-ignore
			client.eventContract,
			'add-role::v2020_12_25'
		)
	}

	@test()
	protected static async beforeEachResetsBackToSavedContract() {
		this.createDirWriteContractFileAndSetCwd([
			{
				eventSignatures: {
					['new-event']: true,
				},
			},
		])

		const client = (await this.connectToApi()) as MercuryTestClient

		await MercuryFixture.beforeEach(this.cwd)

		await client.on('new-event', () => {})
	}

	@test()
	protected static async typesTestProperly() {
		const test = () => {
			return {} as TestConnectFactory
		}

		const value: MercuryConnectFactory = test()

		assert.isTruthy(value)
	}

	@test()
	protected static async canSetDefaultClient() {
		assert.isFunction(MercuryFixture.setDefaultClient)
		const client = await this.connectToApi()

		MercuryFixture.setDefaultClient(client)

		assert.isEqual(MercuryFixture.getDefaultClient(), client)
	}

	@test()
	protected static async allClientsGoingForwardUseThatClient() {
		const client = await this.connectToApi()

		MercuryFixture.setDefaultClient(client)

		const client2 = await this.connectToApi()

		assert.isEqual(client, client2)
	}

	@test()
	protected static async resetsDefaultClientBeforeEach() {
		const client = await this.connectToApi()

		MercuryFixture.setDefaultClient(client)
		await MercuryFixture.beforeEach(this.cwd)

		const client2 = await this.connectToApi()

		assert.isNotEqual(client, client2)
	}

	@test()
	protected static async canForceNewClient() {
		const client = await this.connectToApi()

		MercuryFixture.setDefaultClient(client)

		const client2 = await this.Fixture('mercury').connectToApi({
			shouldReUseClient: false,
		})

		assert.isNotEqual(client, client2)
	}

	private static async connectToApi(options?: TestConnectionOptions) {
		return await new FixtureFactory({ cwd: this.cwd })
			.Fixture('mercury')
			.connectToApi(options)
	}

	private static createDirWriteContractFileAndSetCwd(sigs: any[]) {
		this.cwd = diskUtil.createRandomTempDir()

		const destination = diskUtil.resolvePath(
			this.cwd,
			HASH_SPRUCE_BUILD_DIR,
			'events/events.contract.js'
		)

		const contents = `exports["default"] = ${JSON.stringify([
			...coreEventContracts,
			...sigs,
		])};`

		diskUtil.writeFile(destination, contents)
	}
}
