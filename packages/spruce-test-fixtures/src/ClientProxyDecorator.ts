import { MercuryClient } from '@sprucelabs/mercury-client'
import { functionDelegationUtil } from '@sprucelabs/spruce-skill-utils'

export type TokenGenerator = () =>
	| undefined
	| string
	| Promise<string | undefined>

export default class ClientProxyDecorator {
	private static instance?: ClientProxyDecorator
	private proxyTokenGenerator?: TokenGenerator
	protected constructor() {}

	public static getInstance() {
		if (!this.instance) {
			this.instance = new this()
		}
		return this.instance
	}

	public setProxyTokenGenerator(generator: TokenGenerator) {
		this.proxyTokenGenerator = generator
	}

	public getProxyTokenGenerator() {
		return this.proxyTokenGenerator
	}

	public clearProxyTokenGenerator() {
		this.proxyTokenGenerator = undefined
	}

	public static clearInstance() {
		delete this.instance
	}

	public decorateEmitToPassProxyToken(
		client: any,
		token?: string
	): MercuryClient {
		const newClient = {
			...client,
			proxyToken: token,
			//@ts-ignore
			emit: async (eventName, targetAndPayload, cb) => {
				let builtTp = await this.mixinProxyToken(token, targetAndPayload)
				return client.emit(eventName, builtTp, cb)
			},
			//@ts-ignore
			emitAndFlattenResponses: async (eventName, targetAndPayload, cb) => {
				let builtTp = await this.mixinProxyToken(token, targetAndPayload)
				return client.emitAndFlattenResponses(eventName, builtTp, cb)
			},
		}

		functionDelegationUtil.delegateFunctionCalls(newClient, client)

		newClient.getProxyToken = () => token

		return newClient as any
	}

	private async mixinProxyToken(
		token: string | undefined,
		targetAndPayload: any
	) {
		const t = token || (await this.proxyTokenGenerator?.())

		let builtTp = targetAndPayload

		if (t) {
			if (!builtTp) {
				builtTp = {}
			}

			builtTp.source = {
				...builtTp?.source,
				proxyToken: t,
			}
		}
		return builtTp
	}
}
