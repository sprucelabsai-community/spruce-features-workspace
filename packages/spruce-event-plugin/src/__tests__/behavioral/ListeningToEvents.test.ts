import { MercuryClientFactory } from '@sprucelabs/mercury-client'
import {
	buildEmitTargetAndPayloadSchema,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import { EventFeature } from '../..'
import SpruceError from '../../errors/SpruceError'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface SkillContext {
		helloWorld: string
	}
}

export default class ReceivingEventsTest extends AbstractEventPluginTest {
	protected static async beforeAll() {
		await super.beforeAll()
		MercuryClientFactory.setIsTestMode(false)
	}

	@test()
	protected static async bootEventsForUnregisteredSkillGetProperEventArg() {
		this.cwd = this.resolveTestPath('skill-boot-events')
		await this.bootSkill()
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

		await this.bootSkill()
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
		const { client1, fqen, skill, org } = await this.setupTwoSkillsAndBoot(
			'registered-skill-with-context-checks'
		)

		skill.updateContext('helloWorld', 'yes please')

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

		const skill = await this.bootSkill()

		return { fqen, skill, client1, skill1, skill2, org }
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
}
