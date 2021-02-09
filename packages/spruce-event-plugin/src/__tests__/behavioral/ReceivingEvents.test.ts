import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import SpruceError from '../../errors/SpruceError'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class ReceivingEventsTest extends AbstractEventPluginTest {
	@test()
	protected static async bootEventsForUnregisteredSkillGetProperEventArg() {
		this.cwd = this.resolveTestPath('skill-boot-events')
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
	protected static async eventsGetProperPayloads() {
		this.cwd = await this.setupSkillDir()

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

		const {
			payloads,
			errors,
		} = eventResponseUtil.getAllResponsePayloadsAndErrors(results, SpruceError)

		assert.isFalsy(errors)

		assert.isEqualDeep(payloads[0], { taco: 'bravo' })
	}

	private static setupListeners(skill: any) {
		diskUtil.moveDir(
			this.resolvePath('src/listeners/namespace'),
			this.resolvePath(`src/listeners/`, skill.slug)
		)
	}

	private static async setupSkillDir() {
		const source = this.resolveTestPath('registered-skill')
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
