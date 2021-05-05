import { DatabaseFixture } from '@sprucelabs/data-stores'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import {
	AbstractSkillTest,
	SkillFactoryOptions,
} from '@sprucelabs/spruce-skill-booter'
import FixtureFactory from '../fixtures/FixtureFactory'
import MercuryFixture from '../fixtures/MercuryFixture'
import { FixtureName } from '../types/fixture.types'
import messageTestUtility from './messageTest.utility'

export type Message = SpruceSchemas.Spruce.v2020_07_22.Message

export default abstract class AbstractSpruceFixtureTest extends AbstractSkillTest {
	protected static async beforeAll() {
		await super.beforeAll()

		MercuryFixture.beforeAll()
		DatabaseFixture.beforeAll()
	}

	protected static async beforeEach() {
		await super.beforeEach()
		MercuryFixture.beforeEach()
	}

	protected static async afterEach() {
		await super.afterEach()
		await FixtureFactory.destroy()
	}

	protected static Fixture<Name extends FixtureName>(name: Name) {
		return FixtureFactory.Fixture(name)
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

	protected static buildMessage<T extends Partial<Message>>(
		values: T
	): Message & T {
		return messageTestUtility.buildMessage(values)
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
