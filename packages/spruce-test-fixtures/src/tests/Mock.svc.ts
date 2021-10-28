import {
	AbstractSkillViewController,
	SkillViewControllerLoadOptions,
	SpruceSchemas,
} from '@sprucelabs/heartwood-view-controllers'

interface Args {}

export default class MockSkillViewController extends AbstractSkillViewController {
	public static id = 'mock.root'

	public async load(_options: SkillViewControllerLoadOptions<Args>) {}

	public render(): SpruceSchemas.HeartwoodViewControllers.v2021_02_11.SkillView {
		return {
			layouts: [],
		}
	}
}
