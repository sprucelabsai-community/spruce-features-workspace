import { MercuryClient } from '@sprucelabs/mercury-client'
import { functionDelegationUtil } from '@sprucelabs/spruce-skill-utils'

type Cb = () => undefined | string | Promise<string | undefined>

export default class ClientProxyDecorator {
	private static instance?: ClientProxyDecorator
	private proxyTokenGenerator?: Cb
	protected constructor() {}

	public static getInstance() {
		if (!this.instance) {
			this.instance = new this()
		}
		return this.instance
	}

	public setProxyTokenGenerator(generator: Cb) {
		this.proxyTokenGenerator = generator
	}

	public getProxyTokenGenerator() {
		return this.proxyTokenGenerator
	}

	public static clearInstance() {
		delete this.instance
	}

	public decorateEmitToPassProxyToken(
		client: any,
		token?: string
	): MercuryClient {
		const newClient = {
			//@ts-ignore
			emit: async (eventName, tp, cb) => {
				token = token || (await this.proxyTokenGenerator?.())

				let builtTp = tp

				if (token) {
					if (!builtTp) {
						builtTp = {}
					}

					builtTp.source = {
						...builtTp?.source,
						proxyToken: token,
					}
				}

				return client.emit(eventName, builtTp, cb)
			},
		}

		functionDelegationUtil.delegateFunctionCalls(newClient, client)

		return newClient as any
	}
}
