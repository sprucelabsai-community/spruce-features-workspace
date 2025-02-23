import { test, assert } from '@sprucelabs/test-utils'

import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'

export default class FixtureWarehouseTest extends AbstractSpruceFixtureTest {
    @test()
    protected static viewReusesDependentFixtures() {
        this.assertDependenciesReused('views', [
            'people',
            'organizations',
            'locations',
        ])
    }

    @test()
    protected static async organizationReusesDependentFixtures() {
        this.assertDependenciesReused('organizations', ['people', 'roles'])
    }

    @test()
    protected static locationsReusesDependentFixtures() {
        this.assertDependenciesReused('locations', [
            'organizations',
            'roles',
            'people',
        ])
    }

    @test()
    protected static skillReusesDependentFixtures() {
        this.assertDependenciesReused('skills', ['people'])
    }

    @test()
    protected static seedReusesDependentFixtures() {
        this.assertDependenciesReused('seeder', [
            'organizations',
            'locations',
            'people',
        ])
    }

    private static assertDependenciesReused(
        propName: keyof FixtureWarehouseTest,
        toCheck: string[]
    ) {
        const fixture = this[propName]
        for (const key of toCheck) {
            assert.isEqual(
                //@ts-ignore
                fixture[key],
                //@ts-ignore
                this[key],
                `${key} was not reused in ${propName} fixture`
            )
        }
    }
}
