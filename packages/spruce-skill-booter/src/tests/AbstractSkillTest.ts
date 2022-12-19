import { SchemaRegistry } from '@sprucelabs/schema'
import {
	diskUtil,
	mockLog,
	pluginUtil,
	Skill,
} from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest, { assert } from '@sprucelabs/test-utils'
import SkillImpl from '../skills/Skill'
import {
	SkillFactoryOptions,
	TestBootOptions,
	TestBootWaitOptions,
} from '../types/skill.types'

export default class AbstractSkillTest extends AbstractSpruceTest {
	protected static registeredSkills: Skill[] = []
	protected static skillBootError?: any

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		this.cwd = process.cwd()
	}

	protected static async afterEach() {
		await super.afterEach()

		SchemaRegistry.getInstance().forgetAllSchemas()

		for (const skill of this.registeredSkills) {
			await skill.kill()
		}

		this.registeredSkills = []

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

		this.registeredSkills.push(skill)

		return skill as Skill
	}

	protected static async bootSkill(options?: TestBootOptions) {
		const skill = options?.skill ?? (await this.Skill(options))

		return this.bootSkillAndWait(skill, options)
	}

	private static async bootSkillAndWait(
		skill: Skill,
		options?: TestBootWaitOptions
	): Promise<{
		skill: Skill
		executionPromise: Promise<void>
	}> {
		const { shouldWaitForPostBoot = true } = options ?? {}

		return new Promise((resolve, reject) => {
			let executionPromise: Promise<any>

			const cb = async () => {
				resolve({ skill, executionPromise })
			}

			if (shouldWaitForPostBoot) {
				skill.onPostBoot(cb)
			} else {
				skill.onBoot(cb)
			}

			executionPromise = skill.execute()

			executionPromise.catch((err) => {
				if (options?.shouldSuppressBootErrors) {
					this.skillBootError = err
					resolve({ skill, executionPromise })
				} else {
					reject(err)
				}
			})
		})
	}

	protected static async bootSkillFromTestDir(
		key: string,
		options?: SkillFactoryOptions
	) {
		const skill = await this.SkillFromTestDir(key, options)
		const results = await this.bootSkillAndWait(skill)

		return results
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
			`${new Date().getTime() * Math.random()}`
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
