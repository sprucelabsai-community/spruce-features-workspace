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
import OrganizationFixture from './fixtures/OrganizationFixture'
import PersonFixture from './fixtures/PersonFixture'
import RoleFixture from './fixtures/RoleFixture'
import SeedFixture from './fixtures/SeedFixture'
import SkillFixture from './fixtures/SkillFixture'
import ViewFixture from './fixtures/ViewFixture'

export default abstract class AbstractSpruceFixtureTest extends AbstractSkillTest {
	protected static views: ViewFixture
	protected static roles: RoleFixture
	protected static locations: LocationFixture
	protected static organizations: OrganizationFixture
	protected static people: PersonFixture
	protected static seeder: SeedFixture
	protected static skills: SkillFixture

	protected static async beforeAll() {
		await super.beforeAll()
		await FixtureFactory.beforeAll()

		this.views = this.Fixture('view')
		this.roles = this.Fixture('role')
		this.locations = this.Fixture('location')
		this.organizations = this.Fixture('organization')
		this.people = this.Fixture('person')
		this.seeder = this.Fixture('seed')
		this.skills = this.Fixture('skill')
	}

	protected static async beforeEach() {
		await super.beforeEach()
		await FixtureFactory.beforeEach(this.cwd)
	}

	protected static async afterEach() {
		await super.afterEach()
		await FixtureFactory.afterEach()
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

		const { skill, client } = await this.Fixture('skill').loginAsDemoSkill({
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
		const registeredSkill = await this.Fixture('skill').seedDemoSkill({
			name: 'my test skill',
		})

		process.env.SKILL_ID = registeredSkill.id
		process.env.SKILL_API_KEY = registeredSkill.apiKey

		return this.bootSkillFromTestDir(key)
	}
}
