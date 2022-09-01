import {
	BootCallback,
	Skill,
	SkillFeature,
} from '@sprucelabs/spruce-skill-utils'
//@ts-ignore
import Heroku from 'heroku-client'
import SpruceError from '../errors/SpruceError'
import { DeployHealthCheckItem, HealthCheckDeploy } from '../types/deploy.types'

export class DeployFeature implements SkillFeature {
	private _isBooted = false
	//@ts-ignore
	private executeResolver?: any
	private bootHandler?: BootCallback

	public constructor() {}

	public onBoot(cb: BootCallback): void {
		this.bootHandler = cb
	}

	public async execute(): Promise<void> {
		await this.bootHandler?.()
	}

	public async checkHealth(): Promise<DeployHealthCheckItem> {
		const token = process.env.HEROKU_API_TOKEN
		const appName = process.env.HEROKU_APP_NAME

		if (token && appName) {
			try {
				const deploys = await this.loadDeploys(token, appName)

				return {
					status: 'passed',
					deploys,
				}
			} catch (err: any) {
				return {
					status: 'failed',
					deploys: [],
					errors: [err],
				}
			}
		}

		return {
			status: 'passed',
			deploys: [],
		}
	}

	private async loadDeploys(
		token: string,
		appName: string
	): Promise<HealthCheckDeploy[]> {
		const heroku = new Heroku({ token })

		const apps = await heroku.get('/apps')

		const match = apps.find((app: any) => app.name === appName)

		if (!match) {
			throw new SpruceError({ code: 'HEROKU_ERROR' })
		}

		const isDeployed = match.slug_size > 0

		return [
			{
				provider: 'heroku',
				name: appName,
				webUrl: match.web_url,
				isDeployed,
			},
		]
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
	const feature = new DeployFeature()
	skill.registerFeature('deploy', feature)
}
