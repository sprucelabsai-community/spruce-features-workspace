import { DatabaseFixture } from '@sprucelabs/data-stores'
import { MercuryClient } from '@sprucelabs/mercury-client'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import {
    FixtureName,
    FixtureConstructorOptionsMap,
} from '../../types/fixture.types'
import FixtureFactory from './FixtureFactory'
import LocationFixture from './LocationFixture'
import MercuryFixture from './MercuryFixture'
import OrganizationFixture from './OrganizationFixture'
import PermissionFixture from './PermissionFixture'
import PersonFixture from './PersonFixture'
import RoleFixture from './RoleFixture'
import SeedFixture from './SeedFixture'
import SkillFixture from './SkillFixture'
import StoreFixture from './StoreFixture'
import ViewFixture from './ViewFixture'

export default class FixtureWarehouse {
    public _fakedClient?: MercuryClient
    private _views?: ViewFixture
    private _roles?: RoleFixture
    private _locations?: LocationFixture
    private _organizations?: OrganizationFixture
    private _people?: PersonFixture
    private _seeder?: SeedFixture
    private _skills?: SkillFixture
    private _mercury?: MercuryFixture
    private _stores?: StoreFixture
    private _database?: DatabaseFixture
    private _permissions?: PermissionFixture
    private _fixtures?: FixtureFactory

    private cwd: string
    protected constructor(cwd: string) {
        if (!cwd) {
            debugger
        }
        this.cwd = cwd
    }

    public static Warehouse(cwd: string) {
        return new this(cwd)
    }

    public setCwd(cwd: string) {
        debugger
        this.cwd = cwd
        delete this._fixtures
    }

    public Fixture<Name extends FixtureName>(
        name: Name,
        options?: Partial<FixtureConstructorOptionsMap[Name]>
    ) {
        if (!this._fixtures) {
            const pkg = diskUtil.resolvePath(this.cwd, 'package.json')
            let namespace: string | undefined

            if (diskUtil.doesFileExist(pkg)) {
                const values = JSON.parse(diskUtil.readFile(pkg))
                namespace = values?.skill?.namespace
            }

            this._fixtures = new FixtureFactory({
                cwd: this.cwd,
                namespace,
            })
        }

        return this._fixtures.Fixture(name, options)
    }

    public get views(): ViewFixture {
        if (!this._views) {
            this._views = this.Fixture('view')
        }
        return this._views
    }

    public set views(fixture: ViewFixture | undefined) {
        this._views = fixture
    }

    public get permissions(): PermissionFixture {
        if (!this._permissions) {
            this._permissions = this.Fixture('permission')
        }
        return this._permissions
    }

    public set permissions(fixture: PermissionFixture | undefined) {
        this._permissions = fixture
    }

    public get roles(): RoleFixture {
        if (!this._roles) {
            this._roles = this.Fixture('role')
        }
        return this._roles
    }
    public set roles(fixture: RoleFixture | undefined) {
        this._roles = fixture
    }
    public get locations(): LocationFixture {
        if (!this._locations) {
            this._locations = this.Fixture('location')
        }
        return this._locations
    }
    public set locations(fixture: LocationFixture | undefined) {
        this._locations = fixture
    }
    public get organizations(): OrganizationFixture {
        if (!this._organizations) {
            this._organizations = this.Fixture('organization')
        }
        return this._organizations
    }
    public set organizations(fixture: OrganizationFixture | undefined) {
        this._organizations = fixture
    }
    public get people(): PersonFixture {
        if (!this._people) {
            this._people = this.Fixture('person')
        }
        return this._people
    }
    public set people(fixture: PersonFixture | undefined) {
        this._people = fixture
    }
    public get seeder(): SeedFixture {
        if (!this._seeder) {
            this._seeder = this.Fixture('seed')
        }
        return this._seeder
    }
    public set seeder(fixture: SeedFixture | undefined) {
        this._seeder = fixture
    }
    public get skills(): SkillFixture {
        if (!this._skills) {
            this._skills = this.Fixture('skill')
        }
        return this._skills
    }
    public set skills(fixture: SkillFixture | undefined) {
        this._skills = fixture
    }
    public get mercury(): MercuryFixture {
        if (!this._mercury) {
            this._mercury = this.Fixture('mercury')
        }
        return this._mercury
    }
    public set mercury(fixture: MercuryFixture | undefined) {
        this._mercury = fixture
    }
    public get stores(): StoreFixture {
        if (!this._stores) {
            this._stores = this.Fixture('store')
        }
        return this._stores
    }

    public set stores(fixture: StoreFixture | undefined) {
        this._stores = fixture
    }

    public get database(): DatabaseFixture {
        if (!this._database) {
            this._database = this.Fixture('database')
        }
        return this._database
    }

    public set database(fixture: DatabaseFixture | undefined) {
        this._database = fixture
    }

    public reset() {
        this.views = undefined
        this.roles = undefined
        this.locations = undefined
        this.organizations = undefined
        this.people = undefined
        this.seeder = undefined
        this.skills = undefined
        this.mercury = undefined
        this.stores = undefined
        this.database = undefined
        this.permissions = undefined
    }
}
