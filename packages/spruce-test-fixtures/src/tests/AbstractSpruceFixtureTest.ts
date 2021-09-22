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

export default abstract class AbstractSpruceFixtureTest extends AbstractSkillTest {
	protected static async beforeAll() {
		await super.beforeAll()
		await FixtureFactory.beforeAll()
	}

	protected static async beforeEach() {
		await super.beforeEach()
		await FixtureFactory.beforeEach()
	}

	protected static async afterEach() {
		await super.afterEach()
		await FixtureFactory.afterEach()
	}

	protected static Fixture<Name extends FixtureName>(
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

		const bootedSkill = await this.bootSkill(skillOptions)

		return { skill: bootedSkill, client }
	}

	protected static async bootAndRegisterSkillFromTestDir(key: string) {
		const registeredSkill = await this.Fixture('skill').seedDemoSkill({
			name: 'my test skill',
		})

		process.env.SKILL_ID = registeredSkill.id
		process.env.SKILL_API_KEY = registeredSkill.apiKey

		const skill = await this.bootSkillFromTestDir(key)

		return skill
	}
}
