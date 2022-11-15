import {
	BootCallback,
	HealthCheckItem,
	Skill,
	SkillFeature,
} from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test-utils'
import { AbstractSkillTest } from '../..'
import { FeatureMap } from '../../skills/Skill'
import ThrowingFeature from '../support/ThrowingFeature'

export default class UsingFeaturesTest extends AbstractSkillTest {
	private static skill: Skill
	protected static async beforeEach() {
		await super.beforeEach()
		this.skill = await this.Skill()
		delete process.env.ENABLED_SKILL_FEATURES
	}

	@test()
	protected static async throwsWhenFeatureThrows() {
		const throwing = new ThrowingFeature()
		this.registerFeature('throwing', throwing)

		const err = await assert.doesThrowAsync(() => this.skill.execute())
		assert.isEqual(err.message, 'throwing')
	}

	@test()
	protected static async letsYouSpecifyWhichFeaturesToLoadWithEnv() {
		const one = this.registerFeatureNamed('one')
		const two = this.registerFeatureNamed('two')

		this.setEnabledSkillsAndAssertMapEquals('one', {
			one,
		})

		this.setEnabledSkillsAndAssertMapEquals('two', {
			two,
		})

		this.setEnabledSkillsAndAssertMapEquals('two,one', {
			one,
			two,
		})

		this.setEnabledSkillsAndAssertMapEquals('two,one,234234', {
			one,
			two,
		})
	}

	private static setEnabledSkillsAndAssertMapEquals(
		enabledFeatures: string,
		expected: FeatureMap
	) {
		this.setEnabledSkills(enabledFeatures)
		this.assertFeatureMapEquals(expected)
	}

	private static setEnabledSkills(enabledFeatures: string) {
		process.env.ENABLED_SKILL_FEATURES = enabledFeatures
	}

	private static assertFeatureMapEquals(expected: FeatureMap) {
		//@ts-ignore
		const map = this.skill.featureMap
		assert.isEqualDeep(map, expected)
	}

	private static registerFeatureNamed(name: string) {
		const feature = this.Feature(name)
		this.registerFeature(name, feature)
		return feature
	}

	private static registerFeature(name: string, feature: SkillFeature) {
		this.skill.registerFeature(name, feature)
	}

	private static Feature(name: string) {
		return new DummyFeature(name)
	}
}

class DummyFeature implements SkillFeature {
	public name: string

	public constructor(name: string) {
		this.name = name
	}

	public async execute(): Promise<void> {}
	public async checkHealth(): Promise<HealthCheckItem> {
		return {
			status: 'passed',
		}
	}
	public async isInstalled(): Promise<boolean> {
		return true
	}
	public async destroy(): Promise<void> {}
	public isBooted(): boolean {
		return true
	}
	public onBoot(cb: BootCallback): void {
		void cb()
	}
}
