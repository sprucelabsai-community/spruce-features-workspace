import {
	Authenticator,
	ViewControllerFactory,
	ViewControllerId,
	AbstractViewController,
	ControllerOptions,
	MockStorage,
	SkillViewController,
	RenderOptions,
	ViewController,
	renderUtil,
} from '@sprucelabs/heartwood-view-controllers'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import SpruceError from '../errors/SpruceError'
import viewControllerUtil from '../utilities/viewController.utility'
import { TestRouter } from './routers/TestRouter'

export default abstract class AbstractViewControllerTest extends AbstractSpruceFixtureTest {
	protected static vcDir: string = diskUtil.resolvePath(process.cwd(), 'build')
	private static vcFactory: ViewControllerFactory
	protected static controllerMap: Record<string, any> | undefined

	protected static async beforeEach() {
		await super.beforeEach()
		Authenticator.reset()
		Authenticator.setStorage(new MockStorage())
		process.env.SHOULD_REGISTER_VIEWS = 'false'
		//@ts-ignore
		this.vcFactory = null
	}

	protected static getFactory() {
		if (this.vcFactory) {
			return this.vcFactory
		}

		const mercury = this.Fixture('mercury')
		let controllerMap: any

		try {
			if (!this.vcDir) {
				throw new Error('Missing vc directory')
			}

			controllerMap =
				this.controllerMap ?? viewControllerUtil.buildControllerMap(this.vcDir)
		} catch {
			throw new SpruceError({
				code: 'INVALID_PARAMETERS',
				parameters: ['vcDir'],
				friendlyMessage: `${this.name} needs \`protected static vcDir = diskUtil.resolvePath(__dirname,'..','..')\`. Make it point to the directory that contains the \`.spruce\` directory. Running \`spruce sync.views\` may help too!`,
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

	public static Controller<N extends ViewControllerId>(
		name: N,
		options: ControllerOptions<N>
	) {
		const controller = this.getFactory().Controller(name, options)

		//@ts-ignore
		controller.__renderInvocationCount = 0

		if (
			controller.triggerRender ===
			AbstractViewController.prototype.triggerRender
		) {
			controller.triggerRender = () => {
				//@ts-ignore
				controller.__renderInvocationCount++
			}
		}

		return controller
	}

	protected static async load(spySvc: SkillViewController) {
		const router = new TestRouter(this.getFactory())
		await spySvc.load(router.buildLoadOptions())
	}

	protected static render(vc: ViewController<any>, options?: RenderOptions) {
		return renderUtil.render(vc, options)
	}
}
