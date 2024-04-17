import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import plugin from '../../plugins/deploy.plugin'
import AbstractDeployTest from '../../tests/AbstractDeployTest'

const APP_NAME_NEVER_DEPLOYED = 'spruce-test-app'
const APP_NAME_DEPLOYED = 'sb-skill-schrutebucks-pos'
const APP_NAME_BAD_APP = 'spruce-test-app-bad'
const WEB_URL_NEVER_DEPLOYED = 'https://spruce-test-app.herokuapp.com/'
const WEB_URL_DEPLOYED = 'https://sb-skill-schrutebucks-pos.herokuapp.com/'

export default class CheckingHealthTest extends AbstractDeployTest {
    @test.only('Enable these when needed for deploying to heroku')
    protected static async pluginReturnsInstance() {
        assert.isTruthy(plugin instanceof Function)
    }

    @test()
    protected static async registersWithSkill() {
        const skill = await this.Skill()
        const features = skill.getFeatures()
        assert.isLength(features, 1)
    }

    @test()
    protected static async givesBackEmptyHealthByDefault() {
        const skill = await this.Skill()
        const health = await skill.checkHealth()

        assert.isTruthy(health.deploy)
        assert.isEqual(health.deploy.status, 'passed')
        assert.isArray(health.deploy.deploys)
        assert.isLength(health.deploy.deploys, 0)
    }

    @test()
    protected static async failsHealthCheckWithBadApp() {
        process.env.HEROKU_APP_NAME = APP_NAME_BAD_APP
        process.env.HEROKU_API_TOKEN = process.env.TEST_HEROKU_API_TOKEN
        process.env.HEROKU_TEAM_NAME = 'sprucelabs'

        const skill = await this.Skill()
        const health = await skill.checkHealth()

        assert.isTruthy(health.deploy)
        assert.isEqual(health.deploy.status, 'failed')
        assert.isArray(health.deploy.deploys)
        assert.isLength(health.deploy.deploys, 0)
        assert.isArray(health.deploy.errors)

        const err = health.deploy.errors[0]

        errorAssert.assertError(err, 'HEROKU_ERROR')
    }

    @test()
    protected static async getsBackHealtCheckShowingNotDeployed() {
        process.env.HEROKU_APP_NAME = APP_NAME_NEVER_DEPLOYED
        process.env.HEROKU_API_TOKEN = process.env.TEST_HEROKU_API_TOKEN
        process.env.HEROKU_TEAM_NAME = 'sprucelabs'

        const skill = await this.Skill()
        const health = await skill.checkHealth()

        assert.isTruthy(health.deploy)
        assert.isEqual(health.deploy.status, 'passed')
        assert.isArray(health.deploy.deploys)
        assert.isLength(health.deploy.deploys, 1)
        assert.isFalsy(health.deploy.errors)

        assert.isEqualDeep(health.deploy.deploys, [
            {
                provider: 'heroku',
                name: APP_NAME_NEVER_DEPLOYED,
                webUrl: WEB_URL_NEVER_DEPLOYED,
                isDeployed: false,
            },
        ])
    }

    @test()
    protected static async healthCheckChecksDeployStatus() {
        process.env.HEROKU_APP_NAME = APP_NAME_DEPLOYED
        process.env.HEROKU_API_TOKEN = process.env.TEST_HEROKU_API_TOKEN

        const skill = await this.Skill()
        const health = await skill.checkHealth()

        assert.isTruthy(health.deploy)
        assert.isEqual(health.deploy.status, 'passed')
        assert.isArray(health.deploy.deploys)
        assert.isLength(health.deploy.deploys, 1)

        assert.isEqualDeep(health.deploy.deploys, [
            {
                provider: 'heroku',
                name: APP_NAME_DEPLOYED,
                webUrl: WEB_URL_DEPLOYED,
                isDeployed: true,
            },
        ])
    }

    @test()
    protected static async killingASkillKillsDeploy() {
        const { skill } = await this.bootSkill({})

        await skill.kill()

        assert.isFalse(skill.isRunning())
    }
}
