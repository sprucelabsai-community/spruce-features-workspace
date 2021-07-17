import { MercuryClientFactory } from '@sprucelabs/mercury-client'
import {
	buildEmitTargetAndPayloadSchema,
	eventDiskUtil,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import { EventFeature } from '../..'
import { MercuryFixture } from '../../../../spruce-test-fixtures/build'
import SpruceError from '../../errors/SpruceError'
import { EventFeaturePlugin, MercuryClient } from '../../plugins/event.plugin'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface SkillContext {
		helloWorld: string
	}
}

export default class ReceivingEventsTest extends AbstractEventPluginTest {
	protected static async beforeAll() {
		await super.beforeAll()
	}

	protected static async beforeEach() {
		await super.beforeEach()
		MercuryClientFactory.setIsTestMode(false)

		MercuryFixture.setShouldMixinCoreEventContractsWhenImportingLocal(true)

		delete process.env.DID_BOOT_FIRED
		delete process.env.WILL_BOOT_FIRED
		delete process.env.DID_BOOT_FIRED_2
		delete process.env.WILL_BOOT_FIRED_2
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
		const { skill } = await this.Fixture('skill').loginAsDemoSkill({
			name: 'boot-events',
		})

		process.env.SKILL_API_KEY = '123123'
		process.env.SKILL_ID = '123123'

		process.env.TO_COPY_SKILL_API_KEY = skill.apiKey
		process.env.TO_COPY_SKILL_ID = skill.id

		const booted = await this.bootSkill()
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
		const { skill } = await this.Fixture('skill').loginAsDemoSkill({
			name: 'boot-events',
		})

		process.env.SKILL_API_KEY = skill.apiKey
		process.env.SKILL_ID = skill.id

		await this.bootSkill()
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
		const { skill } = await this.Fixture('skill').loginAsDemoSkill({
			name: 'boot-events',
		})

		let didHit = false
		let didHitForced = false
		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		const runningSkill = await this.Skill()
		void runningSkill.registerFeature('test', {
			execute: async () => {
				const events = runningSkill.getFeatureByCode('event') as EventFeature
				await events.connectToApi()
				didHit = true
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
		const results = await this.setupTwoSkillsRegisterEventsAndEmit(
			'registered-skill'
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
		const err = await assert.doesThrowAsync(() =>
			this.setupTwoSkillsAndBoot('registered-skill-throw-in-will-boot-listener')
		)

		assert.doesInclude(err.message, 'what the')
	}

	@test()
	protected static async sendsSkillContextToListeners() {
		const { client1, fqen, currentSkill, org } =
			await this.setupTwoSkillsAndBoot('registered-skill-with-context-checks')

		currentSkill.updateContext('helloWorld', 'yes please')

		const results = await client1.emit(fqen as any, {
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
	protected static async wontReRegisterListenersIfListenersHaveNotChanged() {
		let unRegisterListenerCount = 0
		const setShouldAutoRegistrationInvocations: boolean[] = []
		const autoRegisterForOn: boolean[] = []

		const { bootedSkill, events } = await this.registerSkillAndSetupListeners({
			onUnregisterListeners: () => {
				unRegisterListenerCount++
			},
			onAttachListeners: (client) => {
				//@ts-ignore
				assert.isTrue(client.shouldAutoRegisterListeners)
			},
			onSetShouldAutoRegisterListeners: (should) => {
				setShouldAutoRegistrationInvocations.push(should)
			},
			onAttachListener: (client) => {
				//@ts-ignore
				autoRegisterForOn.push(client.shouldAutoRegisterListeners)
			},
		})

		await this.bootKillAndResetSkill(bootedSkill, events)

		assert.isLength(
			setShouldAutoRegistrationInvocations,
			2,
			'setShouldAutoRegisterListeners not called enough.'
		)
		assert.isTrue(setShouldAutoRegistrationInvocations[0])
		assert.isTrue(setShouldAutoRegistrationInvocations[1])
		assert.isTrue(autoRegisterForOn[0])

		await this.bootKillAndResetSkill(bootedSkill, events)

		assert.isLength(setShouldAutoRegistrationInvocations, 4)
		assert.isFalse(setShouldAutoRegistrationInvocations[2])
		assert.isTrue(setShouldAutoRegistrationInvocations[3])
		assert.isFalse(autoRegisterForOn[1])

		const listenerDest = eventDiskUtil
			.resolveListenerPath(this.resolvePath('build/listeners'), {
				eventName: 'test',
				eventNamespace: 'test',
				version: 'v2020_01_01',
			})
			.replace('.ts', '.js')

		assert.isEqual(unRegisterListenerCount, 1)

		diskUtil.writeFile(listenerDest, 'exports.default = function() {}')

		await this.bootKillAndResetSkill(bootedSkill, events)

		assert.isLength(setShouldAutoRegistrationInvocations, 6)
		assert.isTrue(setShouldAutoRegistrationInvocations[4])
		assert.isTrue(setShouldAutoRegistrationInvocations[5])
		assert.isTrue(autoRegisterForOn[2])

		//@ts-ignore
		const cacheKey = events.listenerCacher.loadCurrentCacheKey()

		assert.doesNotInclude(cacheKey, this.cwd)
	}

	@test()
	protected static async shouldRegisterListenersEachBootIfEnvNotSet() {
		delete process.env.SHOULD_CACHE_LISTENER_REGISTRATIONS

		let unRegisterListenerCount = 0
		const shoulds: boolean[] = []

		const { bootedSkill, events } = await this.registerSkillAndSetupListeners({
			onUnregisterListeners: () => {
				unRegisterListenerCount++
			},
			onAttachListeners: () => {},
			onSetShouldAutoRegisterListeners: (should) => {
				shoulds.push(should)
			},
			onAttachListener: () => {},
		})

		await this.bootKillAndResetSkill(bootedSkill, events)
		await this.bootKillAndResetSkill(bootedSkill, events)

		assert.isEqual(unRegisterListenerCount, 2)
		assert.isLength(shoulds, 4)
		assert.isTrue(shoulds[0])
		assert.isTrue(shoulds[1])
		assert.isTrue(shoulds[2])
		assert.isTrue(shoulds[3])
	}

	@test()
	protected static async willlReRegisterListenersWithDifferentHost() {
		let unRegisterListenerCount = 0

		const { bootedSkill, events } = await this.registerSkillAndSetupListeners({
			onUnregisterListeners: () => {
				unRegisterListenerCount++
			},
		})

		await this.bootKillAndResetSkill(bootedSkill, events)
		process.env.HOST = process.env.HOST + ':443'

		await this.bootKillAndResetSkill(bootedSkill, events)

		assert.isEqual(unRegisterListenerCount, 2)
	}

	@test()
	protected static async doesNotDestroySettingsFile() {
		const { client1, fqen, currentSkill, org } =
			await this.setupTwoSkillsAndBoot('registered-skill-with-context-checks')

		currentSkill.updateContext('helloWorld', 'yes please')

		const results = await client1.emit(fqen as any, {
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

	private static async bootKillAndResetSkill(
		bootedSkill: any,
		events: EventFeaturePlugin
	) {
		await this.bootSkill({ skill: bootedSkill })
		await bootedSkill.kill()
		events.reset()
		bootedSkill.isKilling = false
	}

	private static async setupTwoSkillsRegisterEventsAndEmit(dirName: string) {
		const { client1, fqen, org } = await this.setupTwoSkillsAndBoot(dirName)

		const results = await client1.emit(fqen as any, {
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
		this.cwd = await this.setupSkillDir(dirName)

		const { skill: skill1, client: client1 } = await this.Fixture(
			'skill'
		).loginAsDemoSkill({
			name: 'skill1',
		})

		const { skill: skill2 } = await this.Fixture('skill').loginAsDemoSkill({
			name: 'skill2',
		})

		const eventName = `my-cool-event::v2021_01_22`
		const fqen = `${skill1.slug}.${eventName}`

		await this.registerEvents(client1, eventName)
		;(client1 as any).mixinContract(this.buildContract(fqen))

		this.setupListenersForEventsRegisteredBySkill(skill1)
		this.generateGoodContractFileForSkill(skill1)

		const orgs = this.Fixture('organization')

		const org = await orgs.seedDemoOrg({ name: 'my new org' })

		await orgs.installSkill(skill1.id, org.id)
		await orgs.installSkill(skill2.id, org.id)

		process.env.SKILL_ID = skill2.id
		process.env.SKILL_API_KEY = skill2.apiKey

		const currentSkill = await this.bootSkill()

		return { fqen, currentSkill, client1, skill1, skill2, org }
	}

	private static setupListenersForEventsRegisteredBySkill(skill: any) {
		diskUtil.moveDir(
			this.resolvePath('build/listeners/namespace'),
			this.resolvePath(`build/listeners/`, skill.slug)
		)
	}

	private static async setupSkillDir(dirName = 'registered-skill') {
		const source = this.resolveTestPath(dirName)
		const destination = this.resolveTestPath(`${new Date().getTime()}/skill`)

		await diskUtil.copyDir(source, destination)

		return destination
	}

	private static async registerEvents(client: any, eventName: string) {
		const contract = this.buildContract(eventName)
		const results = await client.emit(`register-events::v2020_12_25`, {
			payload: {
				contract,
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(results)
	}

	private static buildContract(eventName: string) {
		return {
			eventSignatures: {
				[eventName]: {
					emitPayloadSchema: buildEmitTargetAndPayloadSchema({
						eventName,
						targetSchema: {
							id: 'emitTarget',
							fields: {
								organizationId: {
									type: 'id',
									isRequired: true,
								},
							},
						},
						payloadSchema: {
							id: 'emitPayload',
							fields: {
								foo: {
									type: 'text',
								},
								bar: {
									type: 'text',
								},
								orgId: {
									type: 'text',
								},
							},
						},
					}),
					responsePayloadSchema: {
						id: 'responsePayload',
						fields: {
							taco: {
								type: 'text',
							},
						},
					},
				},
			},
		}
	}

	protected static async registerSkillAndSetupListeners(options?: {
		onUnregisterListeners?: () => void
		onAttachListeners?: (client: MercuryClient) => void
		onSetShouldAutoRegisterListeners?: (should: boolean) => void
		onAttachListener?: (client: MercuryClient) => void
	}) {
		MercuryClientFactory.setIsTestMode(true)

		this.cwd = await this.setupSkillDir('registered-skill')

		const { skill, client } = await this.Fixture('skill').loginAsDemoSkill({
			name: 'skill1',
		})

		const eventName = `my-cool-event::v2021_01_22`
		const fqen = `${skill.slug}.${eventName}`

		await this.registerEvents(client, eventName)
		//@ts-ignore
		client.mixinContract(this.buildContract(fqen))
		this.setupListenersForEventsRegisteredBySkill(skill)
		this.generateGoodContractFileForSkill(skill)

		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		if (options?.onUnregisterListeners) {
			const client2 = await this.Fixture('mercury').connectToApi()
			await client2.on('unregister-listeners::v2020_12_25', async () => {
				options?.onUnregisterListeners?.()
				return { unregisterCount: 0 }
			})
		}

		const bootedSkill = await this.Skill()
		const events = bootedSkill.getFeatureByCode('event') as EventFeaturePlugin

		if (options?.onAttachListeners) {
			//@ts-ignore
			const oldAttachListeners = events.attachListeners.bind(events)

			//@ts-ignore
			events.attachListeners = async (client: any) => {
				const results = await oldAttachListeners(client)
				options?.onAttachListeners?.(client)
				return results
			}
		}

		if (options?.onSetShouldAutoRegisterListeners) {
			const oldConnect = events.connectToApi.bind(events)
			events.connectToApi = async (connectOptions: any) => {
				const client = await oldConnect(connectOptions)

				//@ts-ignore
				client.setShouldAutoRegisterListeners = (should: boolean) => {
					//@ts-ignore
					client.shouldAutoRegisterListeners = should
					options?.onSetShouldAutoRegisterListeners?.(should)
				}

				//@ts-ignore
				client.on = () => {
					//@ts-ignore
					options?.onAttachListener?.(client)
				}

				return client
			}
		}

		return { bootedSkill, events }
	}
}
