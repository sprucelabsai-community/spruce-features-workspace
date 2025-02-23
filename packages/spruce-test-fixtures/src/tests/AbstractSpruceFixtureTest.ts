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
        const skill = await super.SkillFromTestDir(key, options)
        return skill
    }

    public static Fixture<Name extends FixtureName>(
        name: Name,
        options?: Partial<FixtureConstructorOptionsMap[Name]>
    ) {
        return FakerTracker.getFixtures(this.cwd).Fixture(name, options)
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
        return FakerTracker.getFixtures(this.cwd).views
    }

    public static set views(fixture: ViewFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).views = fixture
    }

    public static get permissions(): PermissionFixture {
        return FakerTracker.getFixtures(this.cwd).permissions
    }

    public static set permissions(fixture: PermissionFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).permissions = fixture
    }

    public static get roles(): RoleFixture {
        return FakerTracker.getFixtures(this.cwd).roles
    }

    public static set roles(fixture: RoleFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).roles = fixture
    }

    public static get locations(): LocationFixture {
        return FakerTracker.getFixtures(this.cwd).locations
    }

    public static set locations(fixture: LocationFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).locations = fixture
    }

    public static get organizations(): OrganizationFixture {
        return FakerTracker.getFixtures(this.cwd).organizations
    }

    public static set organizations(fixture: OrganizationFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).organizations = fixture
    }

    public static get people(): PersonFixture {
        return FakerTracker.getFixtures(this.cwd).people
    }

    public static set people(fixture: PersonFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).people = fixture
    }

    public static get seeder(): SeedFixture {
        return FakerTracker.getFixtures(this.cwd).seeder
    }

    public static set seeder(fixture: SeedFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).seeder = fixture
    }

    public static get skills(): SkillFixture {
        return FakerTracker.getFixtures(this.cwd).skills
    }

    public static set skills(fixture: SkillFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).skills = fixture
    }

    public static get mercury(): MercuryFixture {
        return FakerTracker.getFixtures(this.cwd).mercury
    }

    public static set mercury(fixture: MercuryFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).mercury = fixture
    }

    public static get stores(): StoreFixture {
        return FakerTracker.getFixtures(this.cwd).stores
    }

    public static set stores(fixture: StoreFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).stores = fixture
    }

    public static get database(): DatabaseFixture {
        return FakerTracker.getFixtures(this.cwd).database
    }

    public static set database(fixture: DatabaseFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).database = fixture
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
        return FakerTracker.getFixtures(this.cwd).Fixture(name, options)
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
        return FakerTracker.getFixtures(this.cwd).views
    }

    public set views(fixture: ViewFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).views = fixture
    }

    public get permissions(): PermissionFixture {
        return FakerTracker.getFixtures(this.cwd).permissions
    }

    public set permissions(fixture: PermissionFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).permissions = fixture
    }

    public get roles(): RoleFixture {
        return FakerTracker.getFixtures(this.cwd).roles
    }

    public set roles(fixture: RoleFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).roles = fixture
    }

    public get locations(): LocationFixture {
        return FakerTracker.getFixtures(this.cwd).locations
    }

    public set locations(fixture: LocationFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).locations = fixture
    }

    public get organizations(): OrganizationFixture {
        return FakerTracker.getFixtures(this.cwd).organizations
    }

    public set organizations(fixture: OrganizationFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).organizations = fixture
    }

    public get people(): PersonFixture {
        return FakerTracker.getFixtures(this.cwd).people
    }

    public set people(fixture: PersonFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).people = fixture
    }

    public get seeder(): SeedFixture {
        return FakerTracker.getFixtures(this.cwd).seeder
    }

    public set seeder(fixture: SeedFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).seeder = fixture
    }

    public get skills(): SkillFixture {
        return FakerTracker.getFixtures(this.cwd).skills
    }

    public set skills(fixture: SkillFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).skills = fixture
    }

    public get mercury(): MercuryFixture {
        return FakerTracker.getFixtures(this.cwd).mercury
    }

    public set mercury(fixture: MercuryFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).mercury = fixture
    }

    public get stores(): StoreFixture {
        return FakerTracker.getFixtures(this.cwd).stores
    }

    public set stores(fixture: StoreFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).stores = fixture
    }

    public get database(): DatabaseFixture {
        return FakerTracker.getFixtures(this.cwd).database
    }

    public set database(fixture: DatabaseFixture | undefined) {
        FakerTracker.getFixtures(this.cwd).database = fixture
    }
}
