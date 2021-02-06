import {
	buildLog,
	diskUtil,
	mockLog,
	Skill as ISkill,
} from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import Skill, { SkillOptions } from '../../skills/Skill'

export default class SkillTest extends AbstractSpruceTest {
	@test()
	protected static async canCreatSkill() {
		const skill = new Skill({
			rootDir: this.cwd,
			activeDir: diskUtil.resolvePath(this.cwd, 'src'),
			hashSpruceDir: diskUtil.resolvePath(this.cwd, 'src', '.spruce'),
		})
		assert.isTruthy(skill)
	}

	@test()
	protected static async throwsWhenCantFindFeatureByCode() {
		const skill = this.Skill()
		const err = assert.doesThrow(() => skill.getFeatureByCode('unknown'))

		errorAssertUtil.assertError(err, 'INVALID_FEATURE_CODE', {
			suppliedCode: 'unknown',
			validCodes: [],
		})
	}

	@test()
	protected static async throwReturnsValidCodes() {
		const skill = this.Skill()

		//@ts-ignore
		await skill.registerFeature('test', {})

		const err = assert.doesThrow(() => skill.getFeatureByCode('unknown'))

		errorAssertUtil.assertError(err, 'INVALID_FEATURE_CODE', {
			suppliedCode: 'unknown',
			validCodes: ['test'],
		})
	}

	@test()
	protected static async canGetFeatureByCode() {
		const skill = this.Skill()

		//@ts-ignore
		await skill.registerFeature('test', { test: true })

		const match = skill.getFeatureByCode('test')

		//@ts-ignore
		assert.isEqualDeep(match, { test: true })
	}

	@test()
	protected static async skillMarksAsRunning() {
		const skill = this.Skill()
		assert.isFalse(skill.isRunning())

		void skill.execute()
		assert.isTrue(skill.isRunning())

		await skill.kill()

		assert.isFalse(skill.isRunning())
	}

	@test()
	protected static async skillMarksAsDoneRunningWhenFinished() {
		const skill = this.Skill()
		await skill.execute()
		assert.isFalse(skill.isRunning())
	}

	@test()
	protected static async killDestroysFeatures() {
		const skill = this.Skill()
		let wasDestroyCalled = false

		skill.registerFeature('test', {
			execute: async () => {},
			checkHealth: async () => ({ status: 'passed' }),
			isInstalled: async () => true,
			isBooted: () => false,
			destroy: async () => {
				wasDestroyCalled = true
			},
		})

		void skill.execute()

		await skill.kill()

		assert.isTrue(wasDestroyCalled)
	}

	@test()
	protected static async isBootedRightAwayIfNoFeatures() {
		const skill = this.Skill()
		void skill.execute()

		assert.isTrue(skill.isBooted())

		await skill.kill()
	}

	@test()
	protected static async countsItselfAsBootedWhenAllFeaturesAreBooted() {
		const skill = this.Skill()

		let markAsBooted = false

		skill.registerFeature('test', {
			execute: async () => {},
			checkHealth: async () => ({ status: 'passed' }),
			isInstalled: async () => true,
			isBooted: () => markAsBooted,
			destroy: async () => {},
		})

		void skill.execute()

		assert.isFalse(skill.isBooted())

		markAsBooted = true

		assert.isTrue(skill.isBooted())

		await skill.kill()
	}

	@test()
	protected static async logsSkillBootedWhenBooted() {
		let log = ''

		const skill = this.Skill({
			log: {
				prefix: '',
				warn: () => '',
				info: (data) => (log += data),
				error: () => '',
				buildLog,
			},
		})

		skill.registerFeature('test', {
			execute: async () => await new Promise(() => {}),
			checkHealth: async () => ({ status: 'passed' }),
			isBooted: () => true,
			destroy: async () => {},
			isInstalled: async () => true,
		})

		void skill.execute()

		do {
			await this.wait(500)
		} while (!skill.isBooted() && skill.isRunning())

		assert.isAbove(log.search('Skill booted'), -1)
	}

	private static Skill(options?: Partial<SkillOptions>) {
		return new Skill({
			shouldCountdownOnExit: false,
			rootDir: this.cwd,
			activeDir: this.cwd,
			hashSpruceDir: this.cwd,
			log: mockLog,
			...options,
		}) as ISkill
	}
}
