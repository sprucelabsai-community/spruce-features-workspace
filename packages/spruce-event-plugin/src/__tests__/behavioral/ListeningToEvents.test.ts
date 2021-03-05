import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import { EventFeature } from '../..'
import SpruceError from '../../errors/SpruceError'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class ReceivingEventsTest extends AbstractEventPluginTest {
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

		const runningSkill = this.Skill()
		void runningSkill.registerFeature('test', {
			execute: async () => {
				const events = runningSkill.getFeatureByCode('event') as EventFeature
				await events.connectToApi()
				didHit = true
			},
			checkHealth: async () => ({ status: 'passed' }),
			isInstalled: async () => true,
			isBooted: () => false,
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
			isBooted: () => false,
			destroy: async () => {},
		})

		void runningSkill.execute()

		await this.wait(2000)

		assert.isFalse(didHit)
		assert.isTrue(didHitForced)

		await this.wait(6000)

		assert.isTrue(didHit)
	}

	@test()
	protected static async eventsGetProperPayloads() {
		const dirName = 'registered-skill'
		const results = await this.setupTwoSkillsRegisterEventsAndEmit(dirName)

		const {
			payloads,
			errors,
		} = eventResponseUtil.getAllResponsePayloadsAndErrors(results, SpruceError)

		assert.isFalsy(errors)

		assert.isEqualDeep(payloads[0], { taco: 'bravo' })
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
	}

	private static async setupTwoSkillsRegisterEventsAndEmit(dirName: string) {
		this.cwd = await this.setupSkillDir(dirName)

		const skills = this.Fixture('skill')

		const { skill: skill1, client: client1 } = await skills.loginAsDemoSkill({
			name: 'skill1',
		})
		const { skill: skill2 } = await skills.loginAsDemoSkill({
			name: 'skill2',
		})

		const eventName = `my-cool-event::v2021_01_22`
		const fqen = `${skill1.slug}.${eventName}`

		await this.registerEvents(client1, eventName)
		;(client1 as any).mixinContract(this.buildContract(fqen))

		this.setupListeners(skill1)
		this.generateGoodContractFileForSkill(skill1)

		process.env.SKILL_API_KEY = skill2.apiKey
		process.env.SKILL_ID = skill2.id

		await this.bootSkill()

		const results = await client1.emit(fqen, {
			payload: {
				foo: 'bar',
				bar: 'foo',
			},
		})
		return results
	}

	private static setupListeners(skill: any) {
		diskUtil.moveDir(
			this.resolvePath('src/listeners/namespace'),
			this.resolvePath(`src/listeners/`, skill.slug)
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
					emitPayloadSchema: {
						id: 'targetAndPayload',
						fields: {
							payload: {
								type: 'schema',
								options: {
									schema: {
										id: 'emitPayload',
										fields: {
											foo: {
												type: 'text',
											},
											bar: {
												type: 'text',
											},
										},
									},
								},
							},
						},
					},
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
