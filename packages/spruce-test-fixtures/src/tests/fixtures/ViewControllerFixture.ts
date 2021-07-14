import {
	Authenticator,
	ControllerOptions,
	MockStorage,
	SkillViewController,
	ViewControllerFactory,
	ViewControllerId,
} from '@sprucelabs/heartwood-view-controllers'
import { SpruceError } from '@sprucelabs/schema'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import vcFixtureUtil from '../../utilities/vcFixture.utility'
import { TestRouter } from '../routers/TestRouter'
import MercuryFixture from './MercuryFixture'

export default class ViewControllerFixture {
	protected vcDir: string
	private vcFactory?: ViewControllerFactory
	private controllerMap: Record<string, any>
	private mercuryFixture: MercuryFixture

	public constructor(
		mercuryFixture: MercuryFixture,
		options?: { vcDir?: string; controllerMap?: Record<string, any> }
	) {
		this.mercuryFixture = mercuryFixture
		this.vcDir = options?.vcDir ?? diskUtil.resolvePath(process.cwd(), 'build')
		this.controllerMap = options?.controllerMap ?? {}
	}

	public getFactory() {
		if (this.vcFactory) {
			return this.vcFactory
		}

		const mercury = this.mercuryFixture
		let controllerMap: any

		try {
			controllerMap =
				this.controllerMap ?? vcFixtureUtil.buildControllerMap(this.vcDir)
		} catch (err) {
			throw new SpruceError({
				code: 'INVALID_PARAMETERS',
				parameters: ['vcDir'],
				originalError: err,
				friendlyMessage: `Running \`spruce sync.views\` may help here!`,
			})
		}

		this.vcFactory = ViewControllerFactory.Factory({
			controllerMap,
			connectToApi: () => {
				return mercury.connectToApi()
			},
		})

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

	public async load(vc: SkillViewController) {
		const router = new TestRouter(this.getFactory())
		await vc.load(router.buildLoadOptions())
	}
}
