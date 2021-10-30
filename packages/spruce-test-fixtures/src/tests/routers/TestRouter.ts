import {
	AuthenticatorImpl,
	Router,
	SkillViewController,
	SkillViewControllerArgs,
	SkillViewControllerId,
	SkillViewControllerMap,
	ViewControllerFactory,
} from '@sprucelabs/heartwood-view-controllers'
import { AbstractEventEmitter } from '@sprucelabs/mercury-event-emitter'
import {
	buildEventContract,
	MercuryEventEmitter,
} from '@sprucelabs/mercury-types'
import testRouterEmitPayloadSchema from '#spruce/schemas/spruceTestFixtures/v2021_07_19/testRouterEmitPayload.schema'

const contract = buildEventContract({
	eventSignatures: {
		'did-redirect': {
			emitPayloadSchema: testRouterEmitPayloadSchema,
		},
	},
})
type Contract = typeof contract

export default class TestRouter
	extends AbstractEventEmitter<Contract>
	implements Router, MercuryEventEmitter<Contract>
{
	private vcFactory: ViewControllerFactory
	private presentVc?: SkillViewController<any>
	private static vcFactory: ViewControllerFactory
	private static instance?: TestRouter

	private static shouldThrowWhenRedirectingToBadSvc = true

	public static setShouldThrowWhenRedirectingToBadSvc(shouldThrow: boolean) {
		this.shouldThrowWhenRedirectingToBadSvc = shouldThrow
	}

	private constructor(vcFactory: ViewControllerFactory) {
		super(contract)
		this.vcFactory = vcFactory
	}

	public static getInstance() {
		if (!this.instance) {
			this.instance = new this(this.vcFactory)
		}

		if (!this.vcFactory) {
			throw new Error(
				'You need to call TestRouter.setup({ vcFactory }) before using the TestRouter.'
			)
		}

		return this.instance
	}

	public static setup(options: { vcFactory: ViewControllerFactory }) {
		this.vcFactory = options.vcFactory
	}

	public getPresentVc() {
		return this.presentVc
	}

	public async redirect<Id extends SkillViewControllerId>(
		id: Id,
		args?: SkillViewControllerArgs<Id>
	): Promise<SkillViewControllerMap[Id]> {
		if (
			TestRouter.shouldThrowWhenRedirectingToBadSvc ||
			this.vcFactory.hasController(id)
		) {
			//@ts-ignore
			this.presentVc = this.vcFactory.Controller(id, {})
		}

		await this.presentVc?.load(this.buildLoadOptions(args))

		await (this as MercuryEventEmitter<Contract>).emit('did-redirect', {
			id: id as string,
			vc: this.presentVc ?? {},
			args,
		})

		return this.presentVc as any
	}

	public async back() {
		return this.presentVc
	}

	public buildLoadOptions(args: any = {}) {
		return {
			router: this as TestRouter,
			authenticator: AuthenticatorImpl.getInstance(),
			args,
		}
	}
}
