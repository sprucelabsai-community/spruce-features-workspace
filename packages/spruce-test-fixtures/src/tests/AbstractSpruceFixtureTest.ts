import {
	AbstractSkillTest,
	SkillFactoryOptions,
} from '@sprucelabs/spruce-skill-booter'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import {
	FixtureConstructorOptionsMap,
	FixtureName,
} from '../types/fixture.types'
import FixtureFactory from './fixtures/FixtureFactory'
import LocationFixture from './fixtures/LocationFixture'
import MercuryFixture from './fixtures/MercuryFixture'
import OrganizationFixture from './fixtures/OrganizationFixture'
import PersonFixture from './fixtures/PersonFixture'
import RoleFixture from './fixtures/RoleFixture'
import SeedFixture from './fixtures/SeedFixture'
import SkillFixture from './fixtures/SkillFixture'
import StoreFixture from './fixtures/StoreFixture'
import ViewFixture from './fixtures/ViewFixture'

export default abstract class AbstractSpruceFixtureTest extends AbstractSkillTest {
	public static cwd: string
	public static get views(): ViewFixture {
		if (!this._views) {
			this._views = this.Fixture('view')
		}
		return this._views
	}
	public static set views(fixture: ViewFixture | undefined) {
		this._views = fixture
	}
	public static get roles(): RoleFixture {
		if (!this._roles) {
			this._roles = this.Fixture('role')
		}
		return this._roles
	}
	public static set roles(fixture: RoleFixture | undefined) {
		this._roles = fixture
	}
	public static get locations(): LocationFixture {
		if (!this._locations) {
			this._locations = this.Fixture('location')
		}
		return this._locations
	}
	public static set locations(fixture: LocationFixture | undefined) {
		this._locations = fixture
	}
	public static get organizations(): OrganizationFixture {
		if (!this._organizations) {
			this._organizations = this.Fixture('organization')
		}
		return this._organizations
	}
	public static set organizations(fixture: OrganizationFixture | undefined) {
		this._organizations = fixture
	}
	public static get people(): PersonFixture {
		if (!this._people) {
			this._people = this.Fixture('person')
		}
		return this._people
	}
	public static set people(fixture: PersonFixture | undefined) {
		this._people = fixture
	}
	public static get seeder(): SeedFixture {
		if (!this._seeder) {
			this._seeder = this.Fixture('seed')
		}
		return this._seeder
	}
	public static set seeder(fixture: SeedFixture | undefined) {
		this._seeder = fixture
	}
	public static get skills(): SkillFixture {
		if (!this._skills) {
			this._skills = this.Fixture('skill')
		}
		return this._skills
	}
	public static set skills(fixture: SkillFixture | undefined) {
		this._skills = fixture
	}
	public static get mercury(): MercuryFixture {
		if (!this._mercury) {
			this._mercury = this.Fixture('mercury')
		}
		return this._mercury
	}
	public static set mercury(fixture: MercuryFixture | undefined) {
		this._mercury = fixture
	}
	public static get stores(): StoreFixture {
		if (!this._stores) {
			this._stores = this.Fixture('store')
		}
		return this._stores
	}
	public static set stores(fixture: StoreFixture | undefined) {
		this._stores = fixture
	}

	private static _views?: ViewFixture
	private static _roles?: RoleFixture
	private static _locations?: LocationFixture
	private static _organizations?: OrganizationFixture
	private static _people?: PersonFixture
	private static _seeder?: SeedFixture
	private static _skills?: SkillFixture
	private static _mercury?: MercuryFixture
	private static _stores?: StoreFixture

	protected static async beforeAll() {
		await super.beforeAll()
		await FixtureFactory.beforeAll()
	}

	protected static async beforeEach() {
		await super.beforeEach()
		await FixtureFactory.beforeEach(this.cwd)

		this.views = undefined
		this.roles = undefined
		this.locations = undefined
		this.organizations = undefined
		this.people = undefined
		this.seeder = undefined
		this.skills = undefined
		this.mercury = undefined
		this.stores = undefined
	}

	protected static async afterEach() {
		await super.afterEach()
		await FixtureFactory.afterEach()
	}

	protected static async afterAll() {
		await super.afterAll()
		await FixtureFactory.afterAll()
	}

	public static Fixture<Name extends FixtureName>(
		name: Name,
		options?: Partial<FixtureConstructorOptionsMap[Name]>
	) {
		const pkg = diskUtil.resolvePath(this.cwd, 'package.json')
		let namespace: undefined | string

		if (diskUtil.doesFileExist(pkg)) {
			const values = JSON.parse(diskUtil.readFile(pkg))
			namespace = values?.skill?.namespace
		}

		return new FixtureFactory({ cwd: this.cwd, namespace }).Fixture(
			name,
			options
		)
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

		const { skill: bootedSkill, executionPromise } = await this.bootSkill(
			skillOptions
		)

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
}
