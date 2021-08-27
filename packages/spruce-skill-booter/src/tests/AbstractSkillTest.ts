import { SchemaRegistry } from '@sprucelabs/schema'
import {
	diskUtil,
	mockLog,
	pluginUtil,
	Skill,
} from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest, { assert } from '@sprucelabs/test'
import SkillImpl from '../skills/Skill'
import {
	SkillFactoryOptions,
	TestBootOptions,
	TestBootWaitOptions,
} from '../types/skill.types'

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

		const skill = new SkillImpl({
			rootDir: this.cwd,
			shouldCountdownOnExit: false,
			activeDir: this.resolvePath('build'),
			hashSpruceDir: this.cwd,
			log,
			...options,
		})

		for (const plugin of plugins) {
			plugin(skill)
		}

		if (diskUtil.doesBuiltHashSprucePathExist(this.cwd)) {
			const dir = diskUtil.resolveBuiltHashSprucePath(this.cwd)
			await pluginUtil.import([skill], dir)
		}

		this.skills.push(skill)

		return skill as Skill
	}

	protected static async bootSkill(options?: TestBootOptions) {
		const skill = options?.skill ?? (await this.Skill(options))

		await this.bootSkillAndWait(skill, options)

		return skill
	}

	private static async bootSkillAndWait(
		skill: Skill,
		options?: TestBootWaitOptions
	) {
		return new Promise((resolve, reject) => {
			let error: any

			void skill.execute().catch((err) => {
				if (!options?.shouldSuppressBootErrors) {
					error = err
				} else {
					this.skillBootError = err
				}
			})

			void this.waitUntilSkillIsBooted(skill)
				.then(() => {
					if (error) {
						reject(error)
					} else {
						resolve(skill)
					}
				})
				.catch(reject)
		})
	}

	protected static async bootSkillFromTestDir(
		key: string,
		options?: SkillFactoryOptions
	) {
		const skill = await this.SkillFromTestDir(key, options)
		await this.bootSkillAndWait(skill)

		return skill
	}

	protected static async waitUntilSkillIsBooted(skill: Skill) {
		do {
			await this.wait(100)
		} while (!skill.isBooted() && skill.isRunning())

		await this.wait(100)
	}

	protected static async SkillFromTestDir(
		key: string,
		options?: SkillFactoryOptions
	) {
		this.cwd = await this.copySkillFromTestDirToTmpDir(key)
		const skill = await this.Skill(options)

		return skill
	}

	private static async copySkillFromTestDirToTmpDir(
		testDirName: string
	): Promise<string> {
		const destination = this.resolvePath(
			process.cwd(),
			'build',
			'__tests__',
			'/testDirsAndFiles/',
			`${new Date().getTime()}`
		)
		const source = this.resolvePath(
			process.cwd(),
			'build',
			'__tests__',
			'/testDirsAndFiles/',
			testDirName
		)

		await diskUtil.copyDir(source, destination)
		return destination
	}
}
