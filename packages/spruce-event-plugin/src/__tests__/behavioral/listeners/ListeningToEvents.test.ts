import { MercuryClient } from '@sprucelabs/mercury-client'
import {
	eventDiskUtil,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { BootCallback, diskUtil } from '@sprucelabs/spruce-skill-utils'
import { fake } from '@sprucelabs/spruce-test-fixtures'
import { assert, test } from '@sprucelabs/test-utils'
import { EventFeature } from '../../..'
import SpruceError from '../../../errors/SpruceError'
import { EventFeaturePlugin } from '../../../plugins/event.plugin'
import { RegisterSkillSetupListenerOptions } from '../../../tests/fixtures/EventFixture'
import AbstractListenerTest from './AbstractListenersTest'

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface SkillContext {
		helloWorld: string
	}
}

@fake.login()
export default class ListeningToEventsTest extends AbstractListenerTest {
	protected static async beforeEach() {
		await super.beforeEach()

		delete process.env.DID_BOOT_FIRED
		delete process.env.WILL_BOOT_FIRED
		delete process.env.DID_BOOT_FIRED_2
		delete process.env.WILL_BOOT_FIRED_2
		delete process.env.TO_COPY_SKILL_API_KEY
		delete process.env.TO_COPY_SKILL_ID
	}

	@test()
	protected static async bootEventsForUnregisteredSkillGetProperEventArg() {
		this.cwd = this.resolveTestPath('skill-boot-events')
		await this.bootSkill()

		assert.isEqual(process.env.DID_BOOT_FIRED, 'true')
		assert.isEqual(process.env.WILL_BOOT_FIRED, 'true')
	}

	@test()
	protected static async willBootCanFireFirstAndConfigureMercury() {
		this.cwd = this.resolveTestPath('registered-skill-boot-events')

		const { skill } = await this.skills.loginAsDemoSkill({
			name: 'boot-events',
		})

		process.env.SKILL_API_KEY = '123123'
		process.env.SKILL_ID = '123123'

		process.env.TO_COPY_SKILL_API_KEY = skill.apiKey
		process.env.TO_COPY_SKILL_ID = skill.id

		const { skill: booted } = await this.bootSkill()

		const events = booted.getFeatureByCode('event') as EventFeaturePlugin
		const client = await events.connectToApi()

		//@ts-ignore
		assert.isTruthy(client.auth.skill)

		//@ts-ignore
		assert.isEqual(client.auth.skill.id, skill.id)
	}

	@test()
	protected static async didBootEventForRegisteredSkillGetApiClient() {
		this.cwd = this.resolveTestPath('registered-skill-boot-events')

		const { skill } = await this.skills.loginAsDemoSkill({
			name: 'boot-events',
		})

		process.env.SKILL_API_KEY = skill.apiKey
		process.env.SKILL_ID = skill.id

		await this.bootSkill()

		assert.isEqual(
			process.env.REGISTER_SKILL_API_KEY_BOOT_EVENTS,
			process.env.SKILL_API_KEY
		)
	}

	@test()
	protected static async picksTheNewerDidAndWillBootListeners() {
		this.cwd = this.resolveTestPath('skill-versioned-boot-events')
		await this.bootSkill()

		assert.isFalsy(process.env.DID_BOOT_FIRED)
		assert.isFalsy(process.env.WILL_BOOT_FIRED)
		assert.isEqual(process.env.DID_BOOT_FIRED_2, 'true')
		assert.isEqual(process.env.WILL_BOOT_FIRED_2, 'true')
	}

	@test()
	protected static async cantConnectToApiUntilWillBootIsDoneUnlessForced() {
		this.cwd = this.resolveTestPath('registered-skill-boot-events-with-delay')
		const { skill } = await this.skills.loginAsDemoSkill({
			name: 'boot-events',
		})

		let didHit = false
		let didHitForced = false
		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		let cb: () => void
		let cb2: () => void

		const runningSkill = await this.Skill()
		void runningSkill.registerFeature('test', {
			execute: async () => {
				const events = runningSkill.getFeatureByCode('event') as EventFeature
				await events.connectToApi()
				didHit = true
				cb()
			},
			onBoot: (_cb: BootCallback) => {
				cb = _cb
			},
			checkHealth: async () => ({ status: 'passed' }),
			isInstalled: async () => true,
			isBooted: () => didHit,
			destroy: async () => {},
		})

		void runningSkill.registerFeature('test2', {
			execute: async () => {
				const events = runningSkill.getFeatureByCode('event') as EventFeature
				await events.connectToApi({ shouldWaitForWillBoot: false })
				didHitForced = true
				cb2()
			},
			onBoot: (_cb: BootCallback) => {
				cb2 = _cb
			},
			checkHealth: async () => ({ status: 'passed' }),
			isInstalled: async () => true,
			isBooted: () => didHitForced,
			destroy: async () => {},
		})

		void runningSkill.execute()

		await this.wait(2000)

		assert.isFalse(didHit)
		assert.isTrue(didHitForced)

		do {
			await this.wait(1000)
		} while (!didHit)

		assert.isTrue(didHit)

		do {
			await this.wait(1000)
		} while (!runningSkill.isBooted())
	}

	@test()
	protected static async eventsGetProperContext() {
		//assertions in my-cool-event listener
		const results =
			await this.setupTwoSkillsRegisterEventsAndEmit('registered-skill')

		const { payloads, errors } =
			eventResponseUtil.getAllResponsePayloadsAndErrors(results, SpruceError)

		assert.isFalsy(errors)

		assert.isEqualDeep(payloads[0] as any, { taco: 'bravo' })
	}

	@test()
	protected static async eventsGetProxyToken() {
		//assertions in my-cool-event listener
		const results = await this.setupTwoSkillsRegisterEventsAndEmit(
			'registered-skill-proxy-token',
			fake.getClient()
		)

		const { payloads, errors } =
			eventResponseUtil.getAllResponsePayloadsAndErrors(results, SpruceError)

		assert.isFalsy(errors)

		assert.isEqualDeep(payloads[0] as any, { taco: 'bravo' })
	}

	@test()
	protected static async listenerErrorsGetPassedBack() {
		const results = await this.setupTwoSkillsRegisterEventsAndEmit(
			'registered-skill-throw-in-listener'
		)

		assert.isEqual(
			results.responses[0]?.errors?.[0].options.code,
			'LISTENER_ERROR'
		)
		assert.doesInclude(results.responses[0]?.errors?.[0].message, 'Taco')
	}

	@test()
	protected static async didBootErrorErrorsGetPassedBack() {
		const err = await assert.doesThrowAsync(async () => {
			const { executionPromise } = await this.setupTwoSkillsAndBoot(
				'registered-skill-throw-in-will-boot-listener'
			)
			await executionPromise
		})

		assert.doesInclude(err.message, 'what the')
	}

	@test()
	protected static async sendsSkillContextToListeners() {
		const { client1, fqen, currentSkill, org } =
			await this.setupTwoSkillsAndBoot('registered-skill-with-context-checks')

		currentSkill.updateContext('helloWorld', 'yes please')

		//@ts-ignore
		const results = await client1.emit(fqen, {
			//@ts-ignore
			target: {
				organizationId: org.id,
			},
			payload: {
				foo: 'bar',
				bar: 'foo',
			},
		})

		const { taco } = eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isEqual(taco, 'yes please')
	}

	@test()
	protected static async sendsConnectAsSkillToListener() {
		const { client1, fqen, org } = await this.setupTwoSkillsAndBoot(
			'registered-skill-with-client-checks'
		)

		const results = await client1.emit(fqen as any, {
			//@ts-ignore
			target: {
				organizationId: org.id,
			},
			payload: {
				foo: 'bar',
				bar: 'foo',
			},
		})

		const { taco } = eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isEqual(taco, 'all good')
	}

	@test()
	protected static async wontReRegisterListenersIfListenersHaveNotChanged() {
		let unRegisterListenerCount = 0
		let onSetListenerCount = 0
		let shouldAutoRegisterListeners = false
		let lastClient: any

		const { currentSkill, events } =
			await this.setCwdRegisterSkillAndSetupListeners({
				onUnregisterListeners: () => {
					unRegisterListenerCount++
				},
				onListen: (client) => {
					//@ts-ignore
					shouldAutoRegisterListeners = client.shouldAutoRegisterListeners
					onSetListenerCount++
					lastClient = client
				},
			})

		await this.bootKillAndResetSkill(currentSkill, events)

		assert.isEqual(onSetListenerCount, 1)
		assert.isEqual(unRegisterListenerCount, 1)
		assert.isFalse(shouldAutoRegisterListeners)

		await this.bootKillAndResetSkill(currentSkill, events)

		assert.isEqual(onSetListenerCount, 2)
		assert.isEqual(unRegisterListenerCount, 1)
		assert.isFalse(shouldAutoRegisterListeners)

		//@ts-ignore
		assert.isTrue(events.areListenersCached())

		this.addNewListener()

		await this.bootKillAndResetSkill(currentSkill, events)

		assert.isEqual(onSetListenerCount, 3)
		assert.isEqual(unRegisterListenerCount, 2)
		assert.isFalse(shouldAutoRegisterListeners)
		assert.isTrue(lastClient.shouldAutoRegisterListeners)

		//@ts-ignore
		assert.isFalse(events.areListenersCached())
	}

	@test()
	protected static async shouldRegisterListenersEachBootIfEnvNotSet() {
		delete process.env.SHOULD_CACHE_LISTENER_REGISTRATIONS

		const { currentSkill } = await this.setCwdRegisterSkillAndSetupListeners({})
		const events = currentSkill.getFeatureByCode('event') as EventFeaturePlugin
		//@ts-ignore
		assert.isFalse(events.areListenersCached())
	}

	@test()
	protected static async doesNotDestroySettingsFile() {
		const { client1, fqen, currentSkill, org } =
			await this.setupTwoSkillsAndBoot('registered-skill-with-context-checks')

		currentSkill.updateContext('helloWorld', 'yes please')

		//@ts-ignore
		const results = await client1.emit(fqen, {
			//@ts-ignore
			target: {
				organizationId: org.id,
			},
			payload: {
				foo: 'bar',
				bar: 'foo',
			},
		})

		const { taco } = eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isEqual(taco, 'yes please')
	}

	@test()
	protected static async canEmitFromListenerOnAnonEvent() {
		const { fqen, currentSkill } =
			await this.setCwdRegisterSkillAndSetupListeners({
				testDir: 'registered-skill-proxied',
				eventSignature: {
					isGlobal: true,
					emitPermissionContract: {
						id: 'anon-can',
						name: 'can anon',
						permissions: [
							{
								id: 'can-emit',
								name: 'can do it!',
								defaults: {
									anonymous: {
										default: true,
									},
								},
							},
						],
					},
				},
			})

		await this.bootSkill({ skill: currentSkill })

		const client = await this.mercury.connectToApi({ shouldReUseClient: false })

		//@ts-ignore
		client.mixinContract({
			eventSignatures: { 'test-proxied-event::v1': {} },
		})

		//@ts-ignore
		void client.on('test-proxied-event::v1', () => {})

		await client.emitAndFlattenResponses(fqen as any)
	}

	private static addNewListener() {
		const listenerDest = eventDiskUtil
			.resolveListenerPath(this.resolvePath('build/listeners'), {
				eventName: 'test',
				eventNamespace: 'test',
				version: 'v2020_01_01',
			})
			.replace('.ts', '.js')

		diskUtil.writeFile(listenerDest, 'exports.default = function() {}')

		const mapPath = this.resolvePath('build/.spruce/events/listeners.js')
		const content = diskUtil.readFile(mapPath).replace(
			'},',
			`},{
			eventName: 'test',
			eventNamespace: 'test',
			version: 'v2020_01_01',
			callback: require('../../listeners/test/test.v2020_01_01.listener').default
		}`
		)

		const mockPath = mapPath.replace('/events/', '/events/__mocks__/')

		const mockContent = content.replace(/..\/..\//gi, '../../../')
		diskUtil.writeFile(mockPath, mockContent)

		//@ts-ignore
		jest.mock(mapPath)
	}

	private static async bootKillAndResetSkill(
		bootedSkill: any,
		events: EventFeaturePlugin
	) {
		bootedSkill.hasInvokedBootHandlers = false

		await this.bootSkill({ skill: bootedSkill })

		await bootedSkill.kill()

		await events.reset()

		bootedSkill.isKilling = false
	}

	private static async setupTwoSkillsRegisterEventsAndEmit(
		dirName: string,
		client?: MercuryClient
	) {
		const { client1, fqen, org, client2 } =
			await this.setupTwoSkillsAndBoot(dirName)

		await client2.disconnect()

		const results = await (client ?? client1).emit(fqen as any, {
			//@ts-ignore
			target: {
				organizationId: org.id,
			},
			payload: {
				foo: 'bar',
				bar: 'foo',
				orgId: org.id,
			},
		})

		return results
	}

	private static async setupTwoSkillsAndBoot(dirName: string) {
		this.cwd = await this.generateSkillFromTestPath(dirName)

		const { skill: skill1, client: client1 } =
			await this.skills.loginAsDemoSkill({
				name: 'skill1',
			})

		const { skill: skill2, client: client2 } =
			await this.skills.loginAsDemoSkill({
				name: 'skill2',
			})

		const eventName = `my-cool-event::v2021_01_22`
		const fqen = `${skill1.slug}.${eventName}`

		await this.registerEvents(client1, eventName)
		;(client1 as any).mixinContract(this.buildContract(fqen))

		this.setupListenersForEventsRegisteredBySkill(skill1)
		this.generateGoodContractFileForSkill(skill1)

		const org = await this.organizations.seedDemoOrganization({
			name: 'my new org',
		})

		process.env.SKILL_ID = skill2.id
		process.env.SKILL_API_KEY = skill2.apiKey

		const { skill: currentSkill, executionPromise } = await this.bootSkill()

		return {
			fqen,
			currentSkill,
			client1,
			skill1,
			skill2,
			org,
			client2,
			executionPromise,
		}
	}

	private static setupListenersForEventsRegisteredBySkill(skill: any) {
		const eventFixture = this.EventFixture()
		eventFixture.setupListeners(skill.slug)
	}

	private static async registerEvents(
		client: MercuryClient,
		eventName: string
	) {
		return this.EventFixture().registerEvents(client, eventName)
	}

	private static buildContract(eventName: string) {
		return this.EventFixture().buildEventContract(eventName)
	}

	protected static async setCwdRegisterSkillAndSetupListeners(
		options?: {
			testDir?: string
		} & RegisterSkillSetupListenerOptions
	) {
		await this.setCwdToTestSkill(options?.testDir ?? 'registered-skill')
		return this.registerSkillAndSetupListeners(options)
	}
}
