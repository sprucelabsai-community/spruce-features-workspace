import { HealthCheckItem, SkillFeature, Skill, SettingsService } from '@sprucelabs/spruce-skill-utils'

export class StoreFeaturePlugin implements SkillFeature {

    private skill: Skill

    public constructor(skill: Skill) {
        this.skill = skill
    }

    public async execute(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async checkHealth(): Promise<HealthCheckItem> {
        return {
            status: 'passed'
        }
    }

    public async isInstalled() {
        const settingsService = new SettingsService(this.skill.rootDir)
        const isInstalled = settingsService.isMarkedAsInstalled('store')

        return isInstalled
    }

    public async destroy(): Promise<void> {}

    public isBooted(): boolean {
        return true
    }
}


export default (skill: Skill) => {
    const feature = new StoreFeaturePlugin(skill)
    skill.registerFeature('store', feature)
}

