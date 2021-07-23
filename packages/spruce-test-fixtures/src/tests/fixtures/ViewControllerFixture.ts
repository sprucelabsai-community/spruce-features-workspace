import {
	Authenticator,
	ControllerOptions,
	MockStorage,
	SkillViewController,
	vcAssertUtil,
	ViewControllerFactory,
	ViewControllerId,
} from '@sprucelabs/heartwood-view-controllers'
import { SpruceError } from '@sprucelabs/schema'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import TestRouter from '../routers/TestRouter'
import vcFixtureUtil from '../utilities/vcFixture.utility'
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
				vcFixtureUtil.buildControllerMap(this.namespace, this.vcDir)
		} catch (err) {
			throw new SpruceError({
				code: 'INVALID_PARAMETERS',
				parameters: ['vcDir'],
				originalError: err,
				friendlyMessage: `Running \`spruce sync.views\` may help here! You'll need make sure there is a views.[ts|js] in ${this.vcDir.replace(
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
		Authenticator.reset()
		Authenticator.setStorage(new MockStorage())
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
