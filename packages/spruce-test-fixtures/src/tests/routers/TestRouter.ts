import { Locale } from '@sprucelabs/calendar-utils'
import {
	AuthenticatorImpl,
	Authorizer,
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
import FakeThemeManager from '../../__tests__/support/FakeThemeManager'

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
	private static locale: Locale
	private static shouldLoadDestinationVc = false

	private static shouldThrowWhenRedirectingToBadSvc = true
	private scope: Scope
	private locale: Locale

	private readonly themes = new FakeThemeManager()
	private authorizer: Authorizer
	private static authorizer: Authorizer

	public static setShouldThrowWhenRedirectingToBadSvc(shouldThrow: boolean) {
		this.shouldThrowWhenRedirectingToBadSvc = shouldThrow
	}

	private constructor(options: {
		vcFactory: ViewControllerFactory
		scope: Scope
		locale: Locale
		authorizer: Authorizer
	}) {
		super(contract)

		this.vcFactory = options.vcFactory
		this.scope = options.scope
		this.locale = options.locale
		this.authorizer = options.authorizer
	}

	public static setShouldLoadDestinationVc(shouldLoad: boolean) {
		this.shouldLoadDestinationVc = shouldLoad
	}

	public static getInstance() {
		if (!this.instance) {
			this.instance = new this({
				vcFactory: this.vcFactory,
				scope: this.scope,
				locale: this.locale,
				authorizer: this.authorizer,
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

	public getThemes() {
		return this.themes
	}

	public static setup(options: {
		vcFactory: ViewControllerFactory
		scope: Scope
		locale: Locale
		authorizer: Authorizer
	}) {
		this.vcFactory = options.vcFactory
		this.scope = options.scope
		this.locale = options.locale
		this.authorizer = options.authorizer
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
			locale: this.locale,
			authorizer: this.authorizer,
			scope: this.scope,
			themes: this.themes,
		}
	}
}
