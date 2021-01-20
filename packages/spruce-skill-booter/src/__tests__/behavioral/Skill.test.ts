import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import diskUtil from '../../disk.utility'
import Skill from '../../skills/Skill'

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
	protected static async killMarksAsDoneRunningWhenFinished() {
		const skill = this.Skill()
		await skill.execute()
		assert.isFalse(skill.isRunning())
	}

	@test()
	protected static async killDestroysFeatures() {
		const skill = this.Skill()
		let wasDestroyCalled = false

		await skill.registerFeature('test', {
			execute: async () => {},
			checkHealth: async () => ({ status: 'passed' }),
			isInstalled: async () => true,
			destroy: async () => {
				wasDestroyCalled = true
			},
		})

		void skill.execute()

		await skill.kill()

		assert.isTrue(wasDestroyCalled)
	}

	private static Skill() {
		return new Skill({
			rootDir: this.cwd,
			activeDir: this.cwd,
			hashSpruceDir: this.cwd,
		})
	}
}
