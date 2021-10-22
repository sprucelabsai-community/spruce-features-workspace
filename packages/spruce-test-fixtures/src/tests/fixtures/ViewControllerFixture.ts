import {
	AuthenticatorImpl,
	ControllerOptions,
	MockStorage,
	SkillViewController,
	vcAssertUtil,
	ViewControllerFactory,
	ViewControllerId,
} from '@sprucelabs/heartwood-view-controllers'
import { SchemaError } from '@sprucelabs/schema'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import vcDiskUtil from '../../utilities/vcDisk.utility'
import TestRouter from '../routers/TestRouter'
import MercuryFixture from './MercuryFixture'

export default class ViewControllerFixture {
	protected vcDir: string
	private vcFactory?: ViewControllerFactory
	private controllerMap?: Record<string, any>
	private mercuryFixture: MercuryFixture
	private namespace: string

	public constructor(options: {
		mercuryFixture: MercuryFixture
		vcDir?: string
		controllerMap?: Record<string, any>
		namespace: string
	}) {
		this.mercuryFixture = options.mercuryFixture
		this.vcDir = options?.vcDir ?? diskUtil.resolvePath(process.cwd(), 'build')
		this.controllerMap = options?.controllerMap
		this.namespace = options.namespace
	}

	public getFactory() {
		if (this.vcFactory) {
			return this.vcFactory
		}

		const mercury = this.mercuryFixture
		let controllerMap: any

		try {
			controllerMap =
				this.controllerMap ??
				vcDiskUtil.loadViewControllersAndBuildMap(this.namespace, this.vcDir)
		} catch (err: any) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['vcDir'],
				originalError: err,
				friendlyMessage: `No views found! If you are testing, running \`spruce create.view\` will get you started. If you already have views, running \`spruce sync.views\` should help! Heads up, I'm looking for a file called views.[ts|js] in ${this.vcDir.replace(
					'/',
					''
				)}/.spruce/views/views.\n\nOriginal error:\n\n${err.stack}`,
			})
		}

		this.vcFactory = ViewControllerFactory.Factory({
			controllerMap,
			connectToApi: () => {
				return mercury.connectToApi()
			},
		})

		vcAssertUtil._setVcFactory(this.vcFactory)

		return this.vcFactory
	}

	public Controller<N extends ViewControllerId>(
		name: N,
		options: ControllerOptions<N>
	) {
		const controller = this.getFactory().Controller(name, options)
		return controller
	}

	public static async beforeEach() {
		AuthenticatorImpl.reset()
		AuthenticatorImpl.setStorage(new MockStorage())
		process.env.SHOULD_REGISTER_VIEWS = 'false'
	}

	public async load(vc: SkillViewController, args: Record<string, any> = {}) {
		await vc.load(this.getRouter().buildLoadOptions(args))
	}

	public getRouter(): TestRouter {
		TestRouter.setup({ vcFactory: this.getFactory() })
		return TestRouter.getInstance()
	}
}
