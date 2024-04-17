import { assert } from '@sprucelabs/test-utils'

export default function install() {}
install.skills = (...namespaces: string[]) => {
    if (namespaces.length === 0) {
        assert.fail(`You must pass the skill namespaces so I can install them.`)
    }
    return function (Class: any, key: string, descriptor: any) {
        const old = descriptor.value.bind(Class)

        descriptor.value = async (...args: any[]) => {
            const orgsFixture = Class.Fixture('organization')
            const latestOrg = await orgsFixture.getNewestOrganization()

            assert.isTruthy(
                latestOrg,
                `You need to seed at least 1 organization. Heads up, I'll install it in the newest organization only.`
            )

            await orgsFixture.installSkillsByNamespace({
                organizationId: latestOrg.id,
                namespaces,
            })

            return old(...args)
        }
    }
}
