import { DatabaseFixture } from '@sprucelabs/data-stores'
import { SchemaError } from '@sprucelabs/schema'
import { ClientProxyDecorator } from '../..'
import SpruceError from '../../errors/SpruceError'
import {
    FixtureConstructorOptionsMap,
    FixtureMap,
    FixtureName,
} from '../../types/fixture.types'
import EventFixture from './EventFixture'
import LocationFixture from './LocationFixture'
import MercuryFixture from './MercuryFixture'
import OrganizationFixture from './OrganizationFixture'
import PermissionFixture from './PermissionFixture'
import PersonFixture from './PersonFixture'
import RoleFixture from './RoleFixture'
import SchemaFixture from './SchemaFixture'
import SeedFixture from './SeedFixture'
import SkillFixture from './SkillFixture'
import StoreFixture from './StoreFixture'
import ViewFixture from './ViewFixture'

export default class FixtureFactory {
    private static fixtures: any[] = []
    private cwd: string
    private namespace?: string
    private static mercuryFixture?: MercuryFixture

    public constructor(options: { cwd: string; namespace?: string }) {
        this.cwd = options.cwd
        if (!this.cwd) {
            throw new SchemaError({
                code: 'MISSING_PARAMETERS',
                friendlyMessage: 'Mercury fixture needs cwd.',
                parameters: ['options.cwd'],
            })
        }

        this.namespace = options.namespace
    }

    public setCwd(cwd: string) {
        this.cwd = cwd
    }

    public setNamespace(namespace: string) {
        this.namespace = namespace
    }

    public Fixture<Name extends FixtureName>(
        named: Name,
        options?: Partial<FixtureConstructorOptionsMap[Name]>
    ): FixtureMap[Name] {
        const mercuryFixture = this.getMercuryFixture()
        let fixture: FixtureMap[Name] | undefined

        switch (named) {
            case 'mercury':
                return mercuryFixture as FixtureMap[Name]
            case 'person': {
                fixture = new PersonFixture({
                    connectToApi: mercuryFixture.getConnectFactory(),
                }) as FixtureMap[Name]
                break
            }
            case 'role': {
                fixture = new RoleFixture({
                    //@ts-ignore
                    people: options?.people ?? this.Fixture('person'),
                    getNewestOrg: async () => {
                        return this.Fixture(
                            'organization'
                        ).getNewestOrganization()
                    },
                }) as FixtureMap[Name]
                break
            }
            case 'organization': {
                fixture = new OrganizationFixture({
                    people:
                        //@ts-ignore
                        options?.people ??
                        new PersonFixture({
                            connectToApi: mercuryFixture.getConnectFactory(),
                        }),
                    //@ts-ignore
                    roles: options?.roles ?? this.Fixture('role'),
                }) as FixtureMap[Name]
                break
            }
            case 'skill': {
                const personFixture =
                    //@ts-ignore
                    options?.people ?? this.Fixture('person')

                fixture = new SkillFixture({
                    people: personFixture,
                    connectToApi: mercuryFixture.getConnectFactory(),
                }) as FixtureMap[Name]
                break
            }
            case 'database': {
                fixture = new DatabaseFixture() as FixtureMap[Name]
                break
            }
            case 'store': {
                fixture = new StoreFixture() as FixtureMap[Name]
                break
            }
            case 'location': {
                fixture = new LocationFixture({
                    //@ts-ignore
                    roles: options?.roles ?? this.Fixture('role'),
                    //@ts-ignore
                    people: options?.people ?? this.Fixture('person'),
                    organizations:
                        //@ts-ignore
                        options?.organizations ?? this.Fixture('organization'),
                }) as FixtureMap[Name]
                break
            }
            case 'seed':
                fixture = new SeedFixture({
                    organizations:
                        //@ts-ignore
                        options?.organizations ?? this.Fixture('organization'),
                    //@ts-ignore
                    locations: options?.locations ?? this.Fixture('location'),
                    //@ts-ignore
                    people: options?.people ?? this.Fixture('person'),
                }) as FixtureMap[Name]
                break
            case 'permission':
                fixture = new PermissionFixture(
                    mercuryFixture
                ) as FixtureMap[Name]
                break
            case 'view': {
                if (!this.namespace) {
                    throw new Error(
                        'You need to be in a registered skill to load view controllers.'
                    )
                }
                fixture = new ViewFixture({
                    //@ts-ignore
                    people: options?.people ?? this.Fixture('person'),
                    connectToApi: mercuryFixture.getConnectFactory(),
                    fixtureFactory: this,
                    namespace: this.namespace,
                    proxyDecorator: ClientProxyDecorator.getInstance(),
                    cwd: this.cwd,
                    permissions:
                        //@ts-ignore
                        options?.permissions ?? this.Fixture('permission'),
                    ...options,
                }) as any
                break
            }
        }

        if (fixture) {
            FixtureFactory.fixtures.unshift(fixture)
            return fixture
        }

        throw new SpruceError({
            code: 'INVALID_FIXTURE',
            suppliedName: named,
            validNames: [
                'skill',
                'mercury',
                'person',
                'organization',
                'store',
                'view',
                'seed',
                'location',
                'role',
            ],
        })
    }

    public static clearMercuryFixture() {
        delete this.mercuryFixture
    }

    private getMercuryFixture() {
        if (!FixtureFactory.mercuryFixture) {
            FixtureFactory.mercuryFixture = new MercuryFixture(this.cwd)
        }

        return FixtureFactory.mercuryFixture
    }

    public static async destroy() {
        for (const f of this.fixtures) {
            if (f.destroy) {
                await f.destroy()
            }
        }

        this.fixtures = []
        await FixtureFactory.mercuryFixture?.destroy()
        FixtureFactory.mercuryFixture = undefined
    }

    public static async beforeAll() {
        await Promise.all([
            ViewFixture.beforeAll(),
            MercuryFixture.beforeAll(),
            StoreFixture.beforeAll(),
        ])
    }

    public static async beforeEach(cwd: string) {
        await Promise.all([
            ViewFixture.beforeEach(),
            MercuryFixture.beforeEach(cwd),
            StoreFixture.beforeEach(),
            EventFixture.beforeEach(),
            SchemaFixture.beforeEach(),
            LocationFixture.beforeEach(),
            PermissionFixture.beforeEach(),
        ])
    }

    public static async afterEach() {
        await this.destroy()
        await Promise.all([StoreFixture.afterEach()])
    }

    public static async afterAll() {
        await this.destroy()
    }
}
