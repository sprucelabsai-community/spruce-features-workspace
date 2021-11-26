import {
	AuthenticatorImpl,
	ControllerOptions,
	MockStorage,
	renderUtil,
	Scope,
	SkillViewController,
	vcAssertUtil,
	ViewControllerFactory,
	ViewControllerId,
} from '@sprucelabs/heartwood-view-controllers'
import { SchemaError } from '@sprucelabs/schema'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../../errors/SpruceError'
import { TestConnectFactory } from '../../types/fixture.types'
import vcDiskUtil from '../../utilities/vcDisk.utility'
import MockSkillViewController from '../Mock.svc'
import TestRouter from '../routers/TestRouter'
import FixtureFactory from './FixtureFactory'
import LocationFixture from './LocationFixture'
import OrganizationFixture from './OrganizationFixture'
import PersonFixture from './PersonFixture'
import TestScope from './TestScope'

type Factory = TestConnectFactory

export default class ViewFixture {
	private static vcFactory?: ViewControllerFactory
	protected vcDir: string
	private controllerMap?: Record<string, any>
	private connectToApi: Factory
	private namespace: string
	private personFixture: PersonFixture
	private organizationFixture: OrganizationFixture
	private locationFixture: LocationFixture
	private static scope?: Scope
	private static shouldAutomaticallyResetAuthenticator = true

	public static setShouldAutomaticallyResetAuthenticator(shouldReset: false) {
		this.shouldAutomaticallyResetAuthenticator = shouldReset
	}

	public constructor(options: {
		connectToApi: Factory
		personFixture: PersonFixture
		fixtureFactory: FixtureFactory
		vcDir?: string
		cwd?: string
		controllerMap?: Record<string, any>
		namespace: string
	}) {
		this.connectToApi = options.connectToApi
		this.personFixture = options.personFixture
		this.vcDir =
			options?.vcDir ??
			diskUtil.resolvePath(options.cwd ?? process.cwd(), 'build')
		this.controllerMap = options?.controllerMap
		this.namespace = options.namespace
		this.organizationFixture = options.fixtureFactory.Fixture('organization', {
			personFixture: this.personFixture,
		})
		this.locationFixture = options.fixtureFactory.Fixture('location', {
			personFixture: this.personFixture,
			organizationFixture: this.organizationFixture,
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

	public render(vc: any) {
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
			controllerMap['heartwood.root'] = MockSkillViewController
		}

		this.vcFactory = ViewControllerFactory.Factory({
			controllerMap,
			connectToApi,
		})

		vcAssertUtil._setVcFactory(this.vcFactory)

		const oldFactory = this.vcFactory.Controller.bind(this.vcFactory)

		this.vcFactory.Controller = (...args: any[]) => {
			//@ts-ignore
			const vc = oldFactory(...args)
			vcAssertUtil.attachTriggerRenderCounter(vc)
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
		this.resetAuthenticator()
	}

	public static async beforeEach() {
		if (this.shouldAutomaticallyResetAuthenticator) {
			this.resetAuthenticator()
		}

		TestRouter.reset()

		process.env.SHOULD_REGISTER_VIEWS = 'false'

		ViewFixture.scope = undefined
		ViewFixture.vcFactory = undefined
	}

	private static resetAuthenticator() {
		AuthenticatorImpl.reset()
		AuthenticatorImpl.setStorage(new MockStorage())
	}

	public async load(vc: SkillViewController, args: Record<string, any> = {}) {
		await vc.load(this.getRouter().buildLoadOptions(args))
	}

	public getScope() {
		if (!ViewFixture.scope) {
			ViewFixture.scope = new TestScope({
				organizationFixture: this.organizationFixture,
				locationFixture: this.locationFixture,
			})
		}
		return ViewFixture.scope
	}

	public getRouter(): TestRouter {
		TestRouter.setup({
			vcFactory: this.getFactory(),
			scope: this.getScope(),
		})
		return TestRouter.getInstance()
	}

	public getAuthenticator() {
		return AuthenticatorImpl.getInstance()
	}

	public async loginAsDemoPerson(phone?: string) {
		const { person, token, client } =
			await this.personFixture.loginAsDemoPerson(phone)

		this.getAuthenticator().setSessionToken(token, person)

		return { person, client }
	}
}
