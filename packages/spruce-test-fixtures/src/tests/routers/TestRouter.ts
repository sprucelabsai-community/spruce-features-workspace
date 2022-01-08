import {
	AuthenticatorImpl,
	Router,
	routerTestPatcher,
	Scope,
	SkillViewController,
	SkillViewControllerArgs,
	SkillViewControllerId,
	SkillViewControllerLoadOptions,
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
	private static scope: Scope
	private static shouldLoadDestinationVc = false

	private static shouldThrowWhenRedirectingToBadSvc = true
	private scope: Scope

	public static setShouldThrowWhenRedirectingToBadSvc(shouldThrow: boolean) {
		this.shouldThrowWhenRedirectingToBadSvc = shouldThrow
	}

	private constructor(options: {
		vcFactory: ViewControllerFactory
		scope: Scope
	}) {
		super(contract)

		this.vcFactory = options.vcFactory
		this.scope = options.scope
	}

	public static setShouldLoadDestinationVc(shouldLoad: boolean) {
		this.shouldLoadDestinationVc = shouldLoad
	}

	public static getInstance() {
		if (!this.instance) {
			this.instance = new this({
				vcFactory: this.vcFactory,
				scope: this.scope,
			})

			routerTestPatcher.patchRedirectToThrow(this.instance)
		}

		if (!this.vcFactory) {
			throw new Error(
				'You need to call TestRouter.setup({ vcFactory }) before using the TestRouter.'
			)
		}

		return this.instance
	}

	public static setup(options: {
		vcFactory: ViewControllerFactory
		scope: Scope
	}) {
		this.vcFactory = options.vcFactory
		this.scope = options.scope
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
			debugger
			//@ts-ignore
			this.presentVc = this.vcFactory.Controller(id, {})
		}
		if (TestRouter.shouldLoadDestinationVc) {
			await this.presentVc?.load(this.buildLoadOptions(args))
		}

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

	public static reset() {
		TestRouter.setShouldThrowWhenRedirectingToBadSvc(true)
		TestRouter.instance = undefined
	}

	public buildLoadOptions(args: any = {}): SkillViewControllerLoadOptions {
		return {
			router: this as TestRouter,
			authenticator: AuthenticatorImpl.getInstance(),
			args,
			scope: this.scope,
		}
	}
}
