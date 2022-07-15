import { Locale, LocaleImpl } from '@sprucelabs/calendar-utils'
import {
	ActiveRecordCardViewController,
	AuthenticatorImpl,
	confirmTestPatcher,
	ControllerOptions,
	dialogTestPatcher,
	StubStorage,
	renderUtil,
	Scope,
	SkillViewController,
	SpyDevice,
	SwipeViewControllerImpl,
	vcAssert,
	ViewControllerFactory,
	ViewControllerId,
	formAssert,
	ViewController,
} from '@sprucelabs/heartwood-view-controllers'
import { MercuryClient } from '@sprucelabs/mercury-client'
import { SchemaError } from '@sprucelabs/schema'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { ClientProxyDecorator } from '../..'
import { TokenGenerator } from '../../ClientProxyDecorator'
import SpruceError from '../../errors/SpruceError'
import { ConnectOptions, TestConnectFactory } from '../../types/fixture.types'
import { ArgsFromSvc } from '../../types/view.types'
import spyMapUtil from '../../utilities/SpyMapUtil'
import vcDiskUtil from '../../utilities/vcDisk.utility'
import FakeSkillViewController from '../Fake.svc'
import TestRouter from '../routers/TestRouter'
import SpyAuthorizer from '../SpyAuthorizer'
import FixtureFactory from './FixtureFactory'
import LocationFixture from './LocationFixture'
import OrganizationFixture from './OrganizationFixture'
import PersonFixture from './PersonFixture'
import TestScope from './TestScope'

type Factory = TestConnectFactory
type Client = MercuryClient

export default class ViewFixture {
	private static vcFactory?: ViewControllerFactory
	private static loggedInPersonProxyTokens: Record<string, Promise<string>> = {}
	private static dontResetProxyTokenForPersonId?: string
	private static scope?: Scope
	private static shouldAutomaticallyResetAuthenticator = true
	private static viewClient?: Client
	protected vcDir: string
	private controllerMap?: Record<string, any>
	private connectToApi: Factory
	private namespace: string
	private people: PersonFixture
	private orgs: OrganizationFixture
	private locations: LocationFixture
	private proxyDecorator: ClientProxyDecorator
	private locale: Locale

	public static lockProxyCacheForPerson(id: any) {
		this.dontResetProxyTokenForPersonId = id
	}

	public static setShouldAutomaticallyResetAuth(shouldReset: false) {
		this.shouldAutomaticallyResetAuthenticator = shouldReset
	}

	public constructor(options: {
		connectToApi: Factory
		people: PersonFixture
		fixtureFactory: FixtureFactory
		vcDir?: string
		cwd?: string
		controllerMap?: Record<string, any>
		namespace: string
		proxyDecorator: ClientProxyDecorator
	}) {
		this.connectToApi = options.connectToApi
		this.people = options.people
		this.vcDir =
			options?.vcDir ??
			diskUtil.resolvePath(options.cwd ?? process.cwd(), 'build')
		this.controllerMap = options?.controllerMap
		this.namespace = options.namespace
		this.proxyDecorator = options.proxyDecorator
		this.orgs = options.fixtureFactory.Fixture('organization', {
			people: this.people,
		})

		this.locale = new LocaleImpl()
		this.locations = options.fixtureFactory.Fixture('location', {
			people: this.people,
			organizations: this.orgs,
		})
	}

	public getFactory() {
		return ViewFixture.getSharedFactory({
			namespace: this.namespace,
			vcDir: this.vcDir,
			controllerMap: this.controllerMap,
			connectToApi: this.connectToApi,
		})
	}

	public getMaps() {
		return spyMapUtil
	}

	public render<VC extends ViewController<any>>(
		vc: VC
	): ReturnType<VC['render']> {
		return renderUtil.render(vc)
	}

	private static getSharedFactory(options: {
		namespace: string
		vcDir: string
		controllerMap?: any
		connectToApi: Factory
	}) {
		if (this.vcFactory) {
			if (options.controllerMap) {
				this.vcFactory.mixinControllers(options.controllerMap)
			}

			return this.vcFactory
		}

		const { namespace, controllerMap: map, vcDir, connectToApi } = options

		let controllerMap: any

		try {
			const loadedControllerMap = vcDiskUtil.loadViewControllersAndBuildMap(
				namespace,
				vcDir
			)

			controllerMap = {
				...loadedControllerMap,
				...map,
			}
		} catch (err: any) {
			if (!map) {
				throw new SchemaError({
					code: 'INVALID_PARAMETERS',
					parameters: ['vcDir'],
					originalError: err,
					friendlyMessage: `No views found! If you are testing, running \`spruce create.view\` will get you started. If you already have views, running \`spruce sync.views\` should help! Heads up, I'm looking for a file called views.[ts|js] in ${vcDir.replace(
						'/',
						''
					)}/.spruce/views/views.\n\nOriginal error:\n\n${err.stack}`,
				})
			} else {
				controllerMap = map
			}
		}

		if (!controllerMap['heartwood.root']) {
			controllerMap['heartwood.root'] = FakeSkillViewController
		}

		this.vcFactory = ViewControllerFactory.Factory({
			controllerMap,
			device: new SpyDevice(),
			connectToApi: async (options?: ConnectOptions) => {
				return this.viewClient ?? connectToApi(options)
			},
			maps: spyMapUtil,
		})

		vcAssert._setVcFactory(this.vcFactory)
		//@ts-ignore
		formAssert._setVcFactory(this.vcFactory)

		const oldFactory = this.vcFactory.Controller.bind(this.vcFactory)

		this.vcFactory.Controller = (...args: any[]) => {
			//@ts-ignore
			const vc = oldFactory(...args)
			vcAssert.attachTriggerRenderCounter(vc)
			vcAssert.patchAlertToThrow(vc)

			dialogTestPatcher.patchDialogToThrow(vc)
			confirmTestPatcher.patchConfirmToThrow(vc)

			return vc
		}

		return this.vcFactory
	}

	public Controller<N extends ViewControllerId>(
		name: N,
		options: ControllerOptions<N>
	) {
		try {
			const controller = this.getFactory().Controller(name, options)
			return controller
		} catch (err: any) {
			if (err.options?.code === 'MISSING_STORAGE') {
				throw new SpruceError({
					...err.options,
					friendlyMessage:
						err.message +
						"\n\nIf you are testing, make sure you're calling `await super.beforeEach()` in your test class.",
				})
			} else {
				throw err
			}
		}
	}

	public static async beforeAll() {
		this.resetAuth()
	}

	public static async beforeEach() {
		SwipeViewControllerImpl.swipeDelay = 0

		if (this.shouldAutomaticallyResetAuthenticator) {
			this.resetAuth()
		}

		this.viewClient = undefined

		const lockedToken =
			this.dontResetProxyTokenForPersonId &&
			ViewFixture.loggedInPersonProxyTokens[this.dontResetProxyTokenForPersonId]

		ViewFixture.loggedInPersonProxyTokens = {}

		if (this.dontResetProxyTokenForPersonId && lockedToken) {
			ViewFixture.loggedInPersonProxyTokens = {
				[this.dontResetProxyTokenForPersonId]: lockedToken,
			}
		}

		TestRouter.reset()
		SpyAuthorizer.reset()
		ViewFixture.resetMaps()

		ActiveRecordCardViewController.setShouldThrowOnResponseError(true)

		process.env.SHOULD_REGISTER_VIEWS = 'false'

		ViewFixture.scope = undefined
		ViewFixture.vcFactory = undefined
	}

	private static resetMaps() {
		spyMapUtil.lastOpenNavigationOptions = undefined
	}

	private static resetAuth() {
		AuthenticatorImpl.reset()
		AuthenticatorImpl.setStorage(new StubStorage())
		ClientProxyDecorator.getInstance().clearProxyTokenGenerator()
	}

	public async load<Svc extends SkillViewController = SkillViewController>(
		vc: Pick<Svc, 'load' | 'getScope'>,
		args?: ArgsFromSvc<Svc>
	) {
		await this.assertScopeRequirementsMet<Svc>(vc)
		await vc.load(this.getRouter().buildLoadOptions(args ?? {}))
	}

	private async assertScopeRequirementsMet<
		Svc extends SkillViewController = SkillViewController
	>(vc: Pick<Svc, 'load' | 'getScope'>) {
		if ((vc.getScope?.()?.indexOf('organization') ?? -1) > -1) {
			const org = await this.getScope().getCurrentOrganization()
			if (!org) {
				throw new SpruceError({
					code: 'SCOPE_REQUIREMENTS_NOT_MET',
					friendlyMessage: `Your skill view is scoped by organization, but you did not seed an organization! Try @seed('organizations', 1)!`,
				})
			}
		}

		if ((vc.getScope?.()?.indexOf('location') ?? -1) > -1) {
			const location = await this.getScope().getCurrentLocation()
			if (!location) {
				throw new SpruceError({
					code: 'SCOPE_REQUIREMENTS_NOT_MET',
					friendlyMessage: `Your skill view is scoped by location, but you did not seed a location! Try @seed('locations', 1)!`,
				})
			}
		}
	}

	public setScope(scope: Scope) {
		ViewFixture.scope = scope
	}

	public getScope() {
		if (!ViewFixture.scope) {
			ViewFixture.scope = new TestScope({
				organizationFixture: this.orgs,
				locationFixture: this.locations,
			})
		}
		return ViewFixture.scope
	}

	public getLocale() {
		return this.locale
	}

	public getRouter(): TestRouter {
		TestRouter.setup({
			vcFactory: this.getFactory(),
			scope: this.getScope(),
			locale: this.getLocale(),
		})
		return TestRouter.getInstance()
	}

	public getAuthenticator() {
		return AuthenticatorImpl.getInstance()
	}

	public getAuthorizer() {
		return SpyAuthorizer.getInstance()
	}

	public getProxyTokenGenerator() {
		return this.proxyDecorator.getProxyTokenGenerator()
	}

	public setProxyTokenGenerator(cb: TokenGenerator) {
		this.proxyDecorator.setProxyTokenGenerator(cb)
	}

	public async loginAsDemoPerson(phone?: string): Promise<{
		person: SpruceSchemas.Spruce.v2020_07_22.Person
		client: Client
	}> {
		const { person, token, client } = await this.people.loginAsDemoPerson(phone)

		this.getAuthenticator().setSessionToken(token, person)

		this.proxyDecorator.setProxyTokenGenerator(async () => {
			if (!ViewFixture.loggedInPersonProxyTokens[person.id]) {
				const proxyToken = client.registerProxyToken()
				ViewFixture.loggedInPersonProxyTokens[person.id] = proxyToken
			}

			return ViewFixture.loggedInPersonProxyTokens[person.id]
		})

		ViewFixture.viewClient = client

		return { person, client }
	}
}
