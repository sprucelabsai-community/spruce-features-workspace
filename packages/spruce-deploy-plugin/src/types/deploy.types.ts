import { HealthCheckItem } from '@sprucelabs/spruce-skill-utils'

//const deployHealthCheckItem = {
// 	status: 'passed',
// 	errors: undefined,
// 	isDeployed: true,
// 	deploys: [
// 		{
// 			cloudProvider: 'heroku',
// 			appName: 'test-123234509230823',
// 		},
// 	],
// }

export interface HealthCheckDeploy {
	name: string
	provider: string
	webUrl: string
	isDeployed: boolean
}

export interface DeployHealthCheckItem extends HealthCheckItem {
	deploys: HealthCheckDeploy[]
}

declare module '@sprucelabs/spruce-skill-utils/build/skill.types' {
	export interface HealthCheckResults {
		deploy?: DeployHealthCheckItem
	}
}
