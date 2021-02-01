import { Log, Skill, SkillFeature } from '@sprucelabs/spruce-skill-utils'

export class DeployFeature implements SkillFeature {
	//@ts-ignore
	private skill: Skill
	//@ts-ignore
	private log: Log
	//@ts-ignore
	private isExecuting = false
	//@ts-ignore
	private _isBooted = false
	//@ts-ignore
	private executeResolver?: any

	public constructor(skill: Skill) {
		this.skill = skill
		this.log = skill.buildLog('Deploy.Feature')
	}

	public async execute(): Promise<void> {}

	public async checkHealth(): Promise<any> {
		return {
			status: 'passed',
			isDeployed: false,
		}
	}

	public async isInstalled(): Promise<boolean> {
		return true
	}

	public async destroy() {}

	public isBooted() {
		return this._isBooted
	}
}

export default (skill: Skill) => {
	const feature = new DeployFeature(skill)
	skill.registerFeature('deploy', feature)
}
