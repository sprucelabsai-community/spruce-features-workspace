import {
	Authenticator,
	ViewControllerFactory,
	ViewControllerId,
	AbstractViewController,
	ControllerOptions,
	MockStorage,
} from '@sprucelabs/heartwood-view-controllers'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import SpruceError from '../errors/SpruceError'
import viewControllerUtil from '../utilities/viewController.utility'

export default abstract class AbstractViewControllerTest extends AbstractSpruceFixtureTest {
	protected static vcDir: string = diskUtil.resolvePath(process.cwd(), 'build')
	private static vcFactory: ViewControllerFactory

	protected static async beforeEach() {
		await super.beforeEach()
		Authenticator.reset()
		Authenticator.setStorage(new MockStorage())
		//@ts-ignore
		this.vcFactory = null
	}

	private static getFactory() {
		if (this.vcFactory) {
			return this.vcFactory
		}

		if (!this.vcDir) {
			throw new SpruceError({
				code: 'INVALID_PARAMETERS',
				parameters: ['vcDir'],
				friendlyMessage: `${this.name} needs \`protected static vcDir = diskUtil.resolvePath(__dirname,'..','..')\`. Make it point to the directory that contains the \`.spruce\` directory.`,
			})
		}

		const mercury = this.Fixture('mercury')
		const controllerMap = viewControllerUtil.buildControllerMap(this.vcDir)

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
}
