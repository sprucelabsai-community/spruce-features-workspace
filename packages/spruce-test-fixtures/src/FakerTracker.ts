import { MercuryClient } from '@sprucelabs/mercury-client'
import {
    Person,
    Role,
    Skill as ISkill,
    Organization,
    Location,
} from '@sprucelabs/spruce-core-schemas'
import FixtureWarehouse from './tests/fixtures/FixtureWarehourse'

export default class FakerTracker {
    public static fakedClient: MercuryClient
    public static fakedPerson: Person

    private static cwd: string

    public static fakedPeople: Person[] = []
    public static fakedTeammates: Person[] = []
    public static fakedOwners: Person[] = []
    public static fakedRoles: Role[] = []
    public static fakedSkills: ISkill[] = []
    public static fakedManagers: Person[] = []
    public static fakedGuests: Person[] = []
    public static fakedGroupManagers: Person[] = []
    public static fakedPeopleRoles: PersonRole[] = []
    public static fakedInstalledSkills: InstalledSkill[] = []
    public static fakedOrganizations: Organization[] = []
    public static fakedLocations: Location[] = []
    public static fakedProxyTokens: FakedAuthToken[] = []
    public static fakedTokens: FakedAuthToken[] = []

    private static _fixtures?: FixtureWarehouse
    public static get fixtures(): FixtureWarehouse {
        if (!this._fixtures) {
            this._fixtures = FixtureWarehouse.Warehouse(this.cwd)
        }
        return this._fixtures
    }

    public static resetFixtureWarehouse() {
        this._fixtures?.reset()
    }

    public static setCwd(cwd: string) {
        this._fixtures?.setCwd(cwd)
        this.cwd = cwd
    }

    public static resetFakedData() {
        this.fakedOrganizations = []
        this.fakedLocations = []
        this.fakedTeammates = []
        this.fakedInstalledSkills = []
        this.fakedPeopleRoles = []
        this.fakedManagers = []
        this.fakedOwners = []
        this.fakedGroupManagers = []
        this.fakedGuests = []
        this.fakedRoles = []
        this.fakedPeople = this.fakedPeople?.[0] ? [this.fakedPeople[0]] : []
        this.fakedSkills = []
        this.fakedTokens = this.fakedTokens?.[0] ? [this.fakedTokens[0]] : []
        this.fakedProxyTokens = this.fakedProxyTokens?.[0]
            ? [this.fakedProxyTokens[0]]
            : []
    }
}
interface PersonRole {
    roleId: string
    personId: string
    organizationId?: string | null
    locationId?: string | null
}
interface InstalledSkill {
    skillId: string
    orgId: string
}
interface FakedAuthToken {
    personId: string
    token: string
}
