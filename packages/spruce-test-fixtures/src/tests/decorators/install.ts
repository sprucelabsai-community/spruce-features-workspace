import { assert, SpruceTestResolver } from '@sprucelabs/test-utils'
import FakerTracker from '../../FakerTracker'

export default function install() {}
install.skills = (...namespaces: string[]) => {
    if (namespaces.length === 0) {
        assert.fail(`You must pass the skill namespaces so I can install them.`)
    }
    return function (Class: any, key: string, descriptor: any) {
        const old = descriptor.value

        descriptor.value = async (...args: any[]) => {
            const orgsFixture = FakerTracker.getFixtures(Class.cwd).Fixture(
                'organization'
            )
            const latestOrg = await orgsFixture.getNewestOrganization()

            assert.isTruthy(
                latestOrg,
                `You need to seed at least 1 organization. Heads up, I'll install it in the newest organization only.`
            )

            await orgsFixture.installSkillsByNamespace({
                organizationId: latestOrg.id,
                namespaces,
            })

            const Test = SpruceTestResolver.getActiveTest()
            const bound = old.bind(Test)

            return bound(...args)
        }
    }
}
