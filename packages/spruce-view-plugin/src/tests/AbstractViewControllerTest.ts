import {
	ViewControllerId,
	ControllerOptions,
	SkillViewController,
	RenderOptions,
	ViewController,
	renderUtil,
} from '@sprucelabs/heartwood-view-controllers'
import {
	AbstractSpruceFixtureTest,
	ViewControllerFixture,
} from '@sprucelabs/spruce-test-fixtures'

export default abstract class AbstractViewControllerTest extends AbstractSpruceFixtureTest {
	protected static vcDir?: string
	protected static controllerMap: Record<string, any> | undefined
	private static fixture: ViewControllerFixture

	private static getViewControllerFixture() {
		if (!this.fixture) {
			this.fixture = this.Fixture('vc', {
				controllerMap:
					Object.keys(this.controllerMap ?? {}).length > 0
						? this.controllerMap
						: undefined,
				vcDir: this.vcDir,
			})
		}

		return this.fixture
	}

	protected static Controller<N extends ViewControllerId>(
		name: N,
		options: ControllerOptions<N>
	) {
		const controller = this.getViewControllerFixture().Controller(name, options)

		return controller
	}

	protected static getFactory() {
		return this.getViewControllerFixture().getFactory()
	}

	protected static async load(vc: SkillViewController) {
		return this.getViewControllerFixture().load(vc)
	}

	protected static render(vc: ViewController<any>, options?: RenderOptions) {
		return renderUtil.render(vc, options)
	}
}
