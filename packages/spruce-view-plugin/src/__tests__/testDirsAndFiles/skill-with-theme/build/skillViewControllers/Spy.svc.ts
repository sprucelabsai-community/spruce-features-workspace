import { AbstractSkillViewController, SkillViewControllerLoadOptions, SpruceSchemas } from "@sprucelabs/heartwood-view-controllers"

export default class SpySkillViewController extends AbstractSkillViewController {
    public static id = 'spy'
    public loads: SkillViewControllerLoadOptions[] = []
    public async load(options: SkillViewControllerLoadOptions) {
        this.loads.push(options)
    }

    public render(): SpruceSchemas.HeartwoodViewControllers.v2021_02_11.SkillView {
        return {
            layouts: [
                {
                    cards: [{
                        header: {
                            title: 'hey!'
                        }
                    }]
                }
            ],
        }
    }
}
