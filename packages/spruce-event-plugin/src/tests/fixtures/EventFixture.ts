import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import {
	buildEmitTargetAndPayloadSchema,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { diskUtil, Skill } from '@sprucelabs/spruce-skill-utils'
import { MercuryFixture, SkillFixture } from '@sprucelabs/spruce-test-fixtures'
import { EventFeaturePlugin } from '../../plugins/event.plugin'

export default class EventFixture {
	private cwd: string
	private mercuryFixture: MercuryFixture
	private skillFixture: SkillFixture
	private Skill: () => Promise<Skill>

	public constructor(options: {
		cwd: string
		mercuryFixture: MercuryFixture
		skillFixture: SkillFixture
		SkillFactory: () => Promise<Skill>
	}) {
		this.cwd = options.cwd
		this.mercuryFixture = options.mercuryFixture
		this.skillFixture = options.skillFixture
		this.Skill = options.SkillFactory
	}

	public copyListenersIntoPlace(slug: string) {
		diskUtil.moveDir(
			diskUtil.resolvePath(this.cwd, 'build/listeners/namespace'),
			diskUtil.resolvePath(this.cwd, `build/listeners/`, slug)
		)
	}

	public buildContract(eventName: string) {
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

	public async registerEvents(client: MercuryClient, eventName: string) {
		const contract = this.buildContract(eventName)
		const results = await client.emit(`register-events::v2020_12_25`, {
			payload: {
				contract,
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(results)
	}

	public async registerSkillAndSetupListeners(options?: {
		onUnregisterListeners?: () => void
		onAttachListeners?: (client: MercuryClient) => void
		onSetShouldAutoRegisterListeners?: (should: boolean) => void
		onAttachListener?: (client: MercuryClient) => void
	}) {
		MercuryClientFactory.setIsTestMode(true)

		const { skill, client } = await this.skillFixture.loginAsDemoSkill({
			name: 'skill1',
		})

		const eventName = `my-cool-event::v2021_01_22`
		const fqen = `${skill.slug}.${eventName}`

		await this.registerEvents(client, eventName)
		//@ts-ignore
		client.mixinContract(this.buildContract(fqen))
		this.copyListenersIntoPlace(skill.slug)
		this.generateGoodContractFileForSkill(skill.slug)

		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		if (options?.onUnregisterListeners) {
			const client2 = await this.mercuryFixture.connectToApi()
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

	public generateGoodContractFileForSkill(slug: string) {
		const sourceContents = diskUtil.readFile(
			diskUtil.resolvePath(
				this.cwd,
				'build',
				'.spruce',
				'events',
				'source.events.contract.js'
			)
		)

		const updatedContents = sourceContents.replace('{{namespace}}', slug)
		const destination = diskUtil.resolvePath(
			this.cwd,
			'build',
			'.spruce',
			'events',
			'events.contract.js'
		)

		diskUtil.writeFile(destination, updatedContents)
	}
}
