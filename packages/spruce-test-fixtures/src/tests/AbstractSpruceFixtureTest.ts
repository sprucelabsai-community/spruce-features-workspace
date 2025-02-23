import { DatabaseFixture } from '@sprucelabs/data-stores'
import { MercuryClient } from '@sprucelabs/mercury-client'
import {
    Location,
    Organization,
    Person,
    Role,
    Skill as ISkill,
} from '@sprucelabs/spruce-core-schemas'
import {
    AbstractSkillTest,
    SkillFactoryOptions,
} from '@sprucelabs/spruce-skill-booter'
import { Skill, testLog } from '@sprucelabs/spruce-skill-utils'
import { assert } from '@sprucelabs/test-utils'
import FakerTracker from '../FakerTracker'
import {
    FixtureConstructorOptionsMap,
    FixtureName,
} from '../types/fixture.types'
import FixtureFactory from './fixtures/FixtureFactory'
import LocationFixture from './fixtures/LocationFixture'
import MercuryFixture from './fixtures/MercuryFixture'
import OrganizationFixture from './fixtures/OrganizationFixture'
import PermissionFixture from './fixtures/PermissionFixture'
import PersonFixture from './fixtures/PersonFixture'
import RoleFixture from './fixtures/RoleFixture'
import SeedFixture from './fixtures/SeedFixture'
import SkillFixture from './fixtures/SkillFixture'
import StoreFixture from './fixtures/StoreFixture'
import ViewFixture from './fixtures/ViewFixture'
const env = require('dotenv')

export default abstract class AbstractSpruceFixtureTest extends AbstractSkillTest {
    protected static async beforeAll() {
        env.config = () => {}
        await super.beforeAll()

        FakerTracker.setCwd(this.cwd)
        await FixtureFactory.beforeAll()

        console.error = testLog.error
    }

    protected static async beforeEach() {
        await super.beforeEach()
        await FixtureFactory.beforeEach(this.cwd)
        FakerTracker.resetFixtureWarehouse()
    }

    protected static async afterEach() {
        await super.afterEach()
        await FixtureFactory.afterEach()
        FakerTracker.resetFixtureWarehouse()
    }

    protected static async afterAll() {
        await super.afterAll()
        await FixtureFactory.afterAll()
    }

    protected static async bootAndRegisterNewSkill(
        options: SkillFactoryOptions & { name: string; slug?: string }
    ) {
        const { name, slug, ...skillOptions } = options

        const { skill, client } = await this.skills.loginAsDemoSkill({
            name,
            slug,
        })

        process.env.SKILL_ID = skill.id
        process.env.SKILL_API_KEY = skill.apiKey

        const { skill: bootedSkill, executionPromise } =
            await this.bootSkill(skillOptions)

        return { skill: bootedSkill, client, executionPromise }
    }

    protected static async bootAndRegisterSkillFromTestDir(key: string) {
        const registeredSkill = await this.skills.seedDemoSkill({
            name: 'my test skill',
        })

        process.env.SKILL_ID = registeredSkill.id
        process.env.SKILL_API_KEY = registeredSkill.apiKey

        return this.bootSkillFromTestDir(key)
    }

    protected static async SkillFromTestDir(
        key: string,
        options?: SkillFactoryOptions | undefined
    ): Promise<Skill> {
        debugger
        const skill = await super.SkillFromTestDir(key, options)
        FakerTracker.setCwd(this.cwd)
        return skill
    }

    public static Fixture<Name extends FixtureName>(
        name: Name,
        options?: Partial<FixtureConstructorOptionsMap[Name]>
    ) {
        return FakerTracker.fixtures.Fixture(name, options)
    }

    public static get fakedPerson() {
        return FakerTracker.fakedPerson
    }

    public static set fakedPerson(person: Person) {
        FakerTracker.fakedPerson = person
    }

    public static get fakedPeople() {
        return FakerTracker.fakedPeople
    }

    public static set fakedPeople(people: Person[]) {
        FakerTracker.fakedPeople = people
    }

    public static get fakedTeammates() {
        return FakerTracker.fakedTeammates
    }

    public static set fakedTeammates(teammates: Person[]) {
        FakerTracker.fakedTeammates = teammates
    }

    public static get fakedOwners() {
        return FakerTracker.fakedOwners
    }

    public static set fakedOwners(owners: Person[]) {
        FakerTracker.fakedOwners = owners
    }

    public static get fakedRoles() {
        return FakerTracker.fakedRoles
    }

    public static set fakedRoles(roles: Role[]) {
        FakerTracker.fakedRoles = roles
    }

    public static get fakedSkills() {
        return FakerTracker.fakedSkills
    }

    public static set fakedSkills(skills: ISkill[]) {
        FakerTracker.fakedSkills = skills
    }

    public static get fakedManagers() {
        return FakerTracker.fakedManagers
    }

    public static set fakedManagers(managers: Person[]) {
        FakerTracker.fakedManagers = managers
    }

    public static get fakedGuests() {
        return FakerTracker.fakedGuests
    }

    public static set fakedGuests(guests: Person[]) {
        FakerTracker.fakedGuests = guests
    }

    public static get fakedGroupManagers() {
        return FakerTracker.fakedGroupManagers
    }

    public static set fakedGroupManagers(groupManagers: Person[]) {
        FakerTracker.fakedGroupManagers = groupManagers
    }

    public static get fakedClient(): MercuryClient {
        assert.isTruthy(
            FakerTracker.fakedClient,
            `You gotta @fake.login() on your test class to get the test client.`
        )
        return FakerTracker.fakedClient
    }

    public static set fakedClient(client: MercuryClient) {
        FakerTracker.fakedClient = client
    }

    public static get fakedOrganizations(): Organization[] {
        return FakerTracker.fakedOrganizations
    }

    public static set fakedOrganizations(orgs) {
        FakerTracker.fakedOrganizations = orgs
    }

    public static get fakedLocations(): Location[] {
        assert.isAbove(
            FakerTracker.fakedLocations.length,
            0,
            `You gotta @seed('locations', 1) (and use @fake.login(...)) before getting faked locations.`
        )
        return FakerTracker.fakedLocations
    }

    public static set fakedLocations(locations) {
        FakerTracker.fakedLocations = locations
    }

    public static get views(): ViewFixture {
        return FakerTracker.fixtures.views
    }

    public static set views(fixture: ViewFixture | undefined) {
        FakerTracker.fixtures.views = fixture
    }

    public static get permissions(): PermissionFixture {
        return FakerTracker.fixtures.permissions
    }

    public static set permissions(fixture: PermissionFixture | undefined) {
        FakerTracker.fixtures.permissions = fixture
    }

    public static get roles(): RoleFixture {
        return FakerTracker.fixtures.roles
    }

    public static set roles(fixture: RoleFixture | undefined) {
        FakerTracker.fixtures.roles = fixture
    }

    public static get locations(): LocationFixture {
        return FakerTracker.fixtures.locations
    }

    public static set locations(fixture: LocationFixture | undefined) {
        FakerTracker.fixtures.locations = fixture
    }

    public static get organizations(): OrganizationFixture {
        return FakerTracker.fixtures.organizations
    }

    public static set organizations(fixture: OrganizationFixture | undefined) {
        FakerTracker.fixtures.organizations = fixture
    }

    public static get people(): PersonFixture {
        return FakerTracker.fixtures.people
    }

    public static set people(fixture: PersonFixture | undefined) {
        FakerTracker.fixtures.people = fixture
    }

    public static get seeder(): SeedFixture {
        return FakerTracker.fixtures.seeder
    }

    public static set seeder(fixture: SeedFixture | undefined) {
        FakerTracker.fixtures.seeder = fixture
    }

    public static get skills(): SkillFixture {
        return FakerTracker.fixtures.skills
    }

    public static set skills(fixture: SkillFixture | undefined) {
        FakerTracker.fixtures.skills = fixture
    }

    public static get mercury(): MercuryFixture {
        return FakerTracker.fixtures.mercury
    }

    public static set mercury(fixture: MercuryFixture | undefined) {
        FakerTracker.fixtures.mercury = fixture
    }

    public static get stores(): StoreFixture {
        return FakerTracker.fixtures.stores
    }

    public static set stores(fixture: StoreFixture | undefined) {
        FakerTracker.fixtures.stores = fixture
    }

    public static get database(): DatabaseFixture {
        return FakerTracker.fixtures.database
    }

    public static set database(fixture: DatabaseFixture | undefined) {
        FakerTracker.fixtures.database = fixture
    }

    //instance version of things above
    protected async beforeEach() {
        await super.beforeEach()

        await FixtureFactory.beforeEach(this.cwd)
        FakerTracker.resetFixtureWarehouse()
    }

    protected async afterEach() {
        await super.afterEach()
        await FixtureFactory.afterEach()
    }

    public Fixture<Name extends FixtureName>(
        name: Name,
        options?: Partial<FixtureConstructorOptionsMap[Name]>
    ) {
        return FakerTracker.fixtures.Fixture(name, options)
    }

    public get fakedPerson() {
        return FakerTracker.fakedPerson
    }

    public set fakedPerson(person: Person) {
        FakerTracker.fakedPerson = person
    }

    public get fakedPeople() {
        return FakerTracker.fakedPeople
    }

    public set fakedPeople(people: Person[]) {
        FakerTracker.fakedPeople = people
    }

    public get fakedTeammates() {
        return FakerTracker.fakedTeammates
    }

    public set fakedTeammates(teammates: Person[]) {
        FakerTracker.fakedTeammates = teammates
    }

    public get fakedOwners() {
        return FakerTracker.fakedOwners
    }

    public set fakedOwners(owners: Person[]) {
        FakerTracker.fakedOwners = owners
    }

    public get fakedRoles() {
        return FakerTracker.fakedRoles
    }

    public set fakedRoles(roles: Role[]) {
        FakerTracker.fakedRoles = roles
    }

    public get fakedSkills() {
        return FakerTracker.fakedSkills
    }

    public set fakedSkills(skills: ISkill[]) {
        FakerTracker.fakedSkills = skills
    }

    public get fakedManagers() {
        return FakerTracker.fakedManagers
    }

    public set fakedManagers(managers: Person[]) {
        FakerTracker.fakedManagers = managers
    }

    public get fakedGuests() {
        return FakerTracker.fakedGuests
    }

    public set fakedGuests(guests: Person[]) {
        FakerTracker.fakedGuests = guests
    }

    public get fakedGroupManagers() {
        return FakerTracker.fakedGroupManagers
    }

    public set fakedGroupManagers(groupManagers: Person[]) {
        FakerTracker.fakedGroupManagers = groupManagers
    }

    public get fakedClient(): MercuryClient {
        assert.isTruthy(
            FakerTracker.fakedClient,
            `You gotta @fake.login() on your test class to get the test client.`
        )
        return FakerTracker.fakedClient
    }

    public set fakedClient(client: MercuryClient) {
        FakerTracker.fakedClient = client
    }

    public get fakedOrganizations(): Organization[] {
        return FakerTracker.fakedOrganizations
    }

    public set fakedOrganizations(orgs) {
        FakerTracker.fakedOrganizations = orgs
    }

    public get fakedLocations(): Location[] {
        assert.isAbove(
            FakerTracker.fakedLocations.length,
            0,
            `You gotta @seed('locations', 1) (and use @fake.login(...)) before getting faked locations.`
        )
        return FakerTracker.fakedLocations
    }

    public set fakedLocations(locations) {
        FakerTracker.fakedLocations = locations
    }

    public get views(): ViewFixture {
        return FakerTracker.fixtures.views
    }

    public set views(fixture: ViewFixture | undefined) {
        FakerTracker.fixtures.views = fixture
    }

    public get permissions(): PermissionFixture {
        return FakerTracker.fixtures.permissions
    }

    public set permissions(fixture: PermissionFixture | undefined) {
        FakerTracker.fixtures.permissions = fixture
    }

    public get roles(): RoleFixture {
        return FakerTracker.fixtures.roles
    }

    public set roles(fixture: RoleFixture | undefined) {
        FakerTracker.fixtures.roles = fixture
    }

    public get locations(): LocationFixture {
        return FakerTracker.fixtures.locations
    }

    public set locations(fixture: LocationFixture | undefined) {
        FakerTracker.fixtures.locations = fixture
    }

    public get organizations(): OrganizationFixture {
        return FakerTracker.fixtures.organizations
    }

    public set organizations(fixture: OrganizationFixture | undefined) {
        FakerTracker.fixtures.organizations = fixture
    }

    public get people(): PersonFixture {
        return FakerTracker.fixtures.people
    }

    public set people(fixture: PersonFixture | undefined) {
        FakerTracker.fixtures.people = fixture
    }

    public get seeder(): SeedFixture {
        return FakerTracker.fixtures.seeder
    }

    public set seeder(fixture: SeedFixture | undefined) {
        FakerTracker.fixtures.seeder = fixture
    }

    public get skills(): SkillFixture {
        return FakerTracker.fixtures.skills
    }

    public set skills(fixture: SkillFixture | undefined) {
        FakerTracker.fixtures.skills = fixture
    }

    public get mercury(): MercuryFixture {
        return FakerTracker.fixtures.mercury
    }

    public set mercury(fixture: MercuryFixture | undefined) {
        FakerTracker.fixtures.mercury = fixture
    }

    public get stores(): StoreFixture {
        return FakerTracker.fixtures.stores
    }

    public set stores(fixture: StoreFixture | undefined) {
        FakerTracker.fixtures.stores = fixture
    }

    public get database(): DatabaseFixture {
        return FakerTracker.fixtures.database
    }

    public set database(fixture: DatabaseFixture | undefined) {
        FakerTracker.fixtures.database = fixture
    }
}
