import {
	AbstractSkillViewController,
	SkillViewControllerLoadOptions,
	SpruceSchemas,
	ViewControllerOptions,
} from '@sprucelabs/heartwood-view-controllers'

interface Args {}

export default class MockSkillViewController extends AbstractSkillViewController {
	public static id = 'mock.root'

	public constructorOptions: ViewControllerOptions & Record<string, any>
	public args?: Record<string, any>

	public constructor(options: ViewControllerOptions) {
		super(options)
		this.constructorOptions = options
	}

	public async load(options: SkillViewControllerLoadOptions<Args>) {
		this.args = options.args
	}

	public render(): SpruceSchemas.HeartwoodViewControllers.v2021_02_11.SkillView {
		return {
			layouts: [{}],
		}
	}
}
