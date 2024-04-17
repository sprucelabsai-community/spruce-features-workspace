import { HealthCheckItem, SkillFeature } from '@sprucelabs/spruce-skill-utils'

export default class ThrowingFeature implements SkillFeature {
    public async execute(): Promise<void> {
        throw new Error('throwing')
    }
    public async checkHealth(): Promise<HealthCheckItem> {
        return { status: 'passed' }
    }
    public async isInstalled(): Promise<boolean> {
        return true
    }
    public onBoot() {}
    public async destroy(): Promise<void> {}
    public isBooted(): boolean {
        return true
    }
}
