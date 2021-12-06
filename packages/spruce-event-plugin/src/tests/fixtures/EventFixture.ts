import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import { EventSignature } from '@sprucelabs/mercury-types'
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

	public setupListeners(namespace: string) {
		this.copyListenersIntoPlace(namespace)
		this.dropInNamespaceToListenerMap(namespace)
	}

	public copyListenersIntoPlace(slug: string) {
		diskUtil.moveDir(
			diskUtil.resolvePath(this.cwd, 'build/listeners/namespace'),
			diskUtil.resolvePath(this.cwd, `build/listeners/`, slug)
		)
	}

	public dropInNamespaceToListenerMap(namespace: string) {
		const path = diskUtil.resolvePath(
			this.cwd,
			'build/.spruce/events/listeners.js'
		)

		const content = diskUtil
			.readFile(path)
			.replace(/{{namespace}}/gi, namespace)

		diskUtil.writeFile(path, content)
	}

	public buildContract(eventName: string, eventSignature?: EventSignature) {
		return {
			eventSignatures: {
				[eventName]: eventSignature ?? {
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

	public async registerEvents(
		client: MercuryClient,
		eventName: string,
		eventSignature?: EventSignature
	) {
		const contract = this.buildContract(eventName, eventSignature)
		const results = await client.emit(`sync-event-contracts::v2020_12_25`, {
			payload: {
				contract,
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(results)
	}

	public async registerSkillAndSetupListeners(options?: {
		skillDir?: string
		onUnregisterListeners?: () => void
		onAttachListeners?: (client: MercuryClient) => void
		onSetShouldAutoRegisterListeners?: (should: boolean) => void
		onAttachListener?: (client: MercuryClient) => void
		onSetListener?: (client: MercuryClient) => void
		eventSignature?: EventSignature
	}) {
		MercuryClientFactory.setIsTestMode(true)

		const { skill, client } = await this.skillFixture.loginAsDemoSkill({
			name: 'skill1',
		})

		const eventName = `my-cool-event::v2021_01_22`
		const fqen = `${skill.slug}.${eventName}`

		await this.registerEvents(client, eventName, options?.eventSignature)

		const contract = this.buildContract(fqen, options?.eventSignature)

		//@ts-ignore
		client.mixinContract(contract)

		this.copyListenersIntoPlace(skill.slug)
		this.dropInNamespaceToListenerMap(skill.slug)
		this.generateGoodContractFileForSkill(skill.slug, options?.eventSignature)

		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		if (options?.onUnregisterListeners) {
			const client2 = await this.mercuryFixture.connectToApi()
			await client2.on('unregister-listeners::v2020_12_25', async () => {
				options?.onUnregisterListeners?.()
				return { unregisterCount: 0 }
			})
		}

		const currentSkill = await this.Skill()
		const events = currentSkill.getFeatureByCode('event') as EventFeaturePlugin

		if (options?.onSetListener) {
			const attachOnListener = async () => {
				const pluginClient = await events.connectToApi()
				const oldOn = pluginClient.on.bind(pluginClient)

				//@ts-ignore
				pluginClient.on = async (fqen: string, cb: any) => {
					if (fqen.includes('seed-skill')) {
						options?.onSetListener?.(pluginClient)
					} else if (fqen.includes('test')) {
						return
					}

					//@ts-ignore
					return oldOn(fqen, cb)
				}
			}

			const oldReset = events.reset.bind(events)

			events.reset = async () => {
				await oldReset()
				await attachOnListener()
			}
			//@ts-ignore
			await attachOnListener()
		}

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

		return { currentSkill, events, fqen }
	}

	public generateGoodContractFileForSkill(
		slug: string,
		eventSignature?: EventSignature
	) {
		const sourceContents = diskUtil.readFile(
			diskUtil.resolvePath(
				this.cwd,
				'build',
				'.spruce',
				'events',
				'source.events.contract.js'
			)
		)

		let updatedContents = sourceContents.replace('{{namespace}}', slug)
		updatedContents = updatedContents.replace(
			'{{eventSignature}}',
			JSON.stringify(
				eventSignature ?? {
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
							target: {
								type: 'schema',
								options: {
									schema: {
										id: 'target',
										fields: {
											organizationId: {
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
				}
			)
		)

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
