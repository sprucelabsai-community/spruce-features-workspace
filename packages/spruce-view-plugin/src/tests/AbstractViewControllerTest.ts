import {
	ViewControllerId,
	ControllerOptions,
	SkillViewController,
	RenderOptions,
	ViewController,
	renderUtil,
} from '@sprucelabs/heartwood-view-controllers'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'

export default abstract class AbstractViewControllerTest extends AbstractSpruceFixtureTest {
	protected static vcDir?: string
	protected static controllerMap: Record<string, any> | undefined

	private static getViewControllerFixture() {
		return this.Fixture('vc', {
			controllerMap:
				Object.keys(this.controllerMap ?? {}).length > 0
					? this.controllerMap
					: undefined,
			vcDir: this.vcDir,
		})
	}

	public static Controller<N extends ViewControllerId>(
		name: N,
		options: ControllerOptions<N>
	) {
		const controller = this.getViewControllerFixture().Controller(name, options)

		return controller
	}

	protected static async load(vc: SkillViewController) {
		return this.getViewControllerFixture().load(vc)
	}

	protected static render(vc: ViewController<any>, options?: RenderOptions) {
		return renderUtil.render(vc, options)
	}
}
