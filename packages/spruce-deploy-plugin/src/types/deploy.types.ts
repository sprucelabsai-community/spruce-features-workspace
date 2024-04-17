import { HealthCheckItem } from '@sprucelabs/spruce-skill-utils'

export interface HealthCheckDeploy {
    name: string
    provider: string
    webUrl: string
    isDeployed: boolean
}

export interface DeployHealthCheckItem extends HealthCheckItem {
    deploys: HealthCheckDeploy[]
}

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
    export interface HealthCheckResults {
        deploy?: DeployHealthCheckItem
    }
}
