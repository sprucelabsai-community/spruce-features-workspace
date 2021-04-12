import { SchemaRegistry } from '@sprucelabs/schema'
import { diskUtil, mockLog, pluginUtil } from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest, { assert } from '@sprucelabs/test'
import Skill from '../skills/Skill'
import { SkillFactoryOptions } from '../types/skill.types'

export default class AbstractSkillTest extends AbstractSpruceTest {
	protected static skills: Skill[] = []
	protected static skillBootError?: any

	protected static async afterEach() {
		await super.afterEach()

		SchemaRegistry.getInstance().forgetAllSchemas()

		for (const skill of this.skills) {
			await skill.kill()
		}

		this.skills = []

		if (this.skillBootError) {
			const err = this.skillBootError

			this.clearSkillBootErrors()

			const msg =
				'Skill had error during boot:\n\n' +
				(typeof err.prettyPrint === 'function'
					? err.prettyPrint()
					: err.toString())

			assert.fail(msg)
		}
	}

	protected static clearSkillBootErrors() {
		this.skillBootError = undefined
	}

	protected static async Skill(options?: SkillFactoryOptions) {
		const { plugins = [], log = mockLog } = options ?? {}

		const skill = new Skill({
			rootDir: this.cwd,
			shouldCountdownOnExit: false,
			activeDir: this.resolvePath('src'),
			hashSpruceDir: this.cwd,
			log,
			...options,
		})

		for (const plugin of plugins) {
			void plugin(skill)
		}

		if (diskUtil.doesHashSprucePathExist(this.cwd)) {
			const dir = diskUtil.resolveHashSprucePath(this.cwd)
			await pluginUtil.import([skill], dir)
		}

		this.skills.push(skill)

		return skill
	}

	protected static async bootSkill(options?: SkillFactoryOptions) {
		const skill = await this.Skill(options)

		await this.bootSkillAndWait(skill)

		return skill
	}

	private static async bootSkillAndWait(skill: Skill) {
		void skill.execute().catch((err) => {
			this.skillBootError = err
		})

		await this.waitUntilSkillIsBooted(skill)
	}

	protected static async bootSkillFromTestDirAndWait(key: string) {
		const skill = await this.SkillFromTestDir(key)
		await this.bootSkillAndWait(skill)

		return skill
	}

	protected static async waitUntilSkillIsBooted(skill: Skill) {
		do {
			await this.wait(100)
		} while (!skill.isBooted() && skill.isRunning())

		await this.wait(100)
	}

	protected static async SkillFromTestDir(key: string) {
		this.cwd = this.resolvePath(
			process.cwd(),
			'build',
			'__tests__',
			'/testDirsAndFiles/',
			key
		)

		const skill = await this.Skill()

		return skill
	}
}
