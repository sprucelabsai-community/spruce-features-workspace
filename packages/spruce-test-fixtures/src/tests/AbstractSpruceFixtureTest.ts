import { MercuryClientFactory } from '@sprucelabs/mercury-client'
import { coreEventContracts } from '@sprucelabs/mercury-types'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import Skill from '@sprucelabs/spruce-skill-booter'
import { mockLog } from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest from '@sprucelabs/test'
import FixtureFactory from '../fixtures/FixtureFactory'
import { FixtureName, SkillFactoryOptions } from '../types/fixture.types'

export type Message = SpruceSchemas.Spruce.v2020_07_22.Message

export default abstract class AbstractSpruceFixtureTest extends AbstractSpruceTest {
	protected static skills: Skill[] = []

	protected static async beforeAll() {
		await super.beforeAll()
		MercuryClientFactory.setIsTestMode(true)
		MercuryClientFactory.setDefaultContract(coreEventContracts[0])
	}

	protected static async afterEach() {
		await super.afterEach()
		await FixtureFactory.destroy()

		for (const skill of this.skills) {
			await skill.kill()
		}

		this.skills = []
	}

	protected static Fixture<Name extends FixtureName>(name: Name) {
		return FixtureFactory.Fixture(name)
	}

	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [], log = mockLog } = options ?? {}

		const skill = new Skill({
			rootDir: this.cwd,
			activeDir: this.resolvePath('src'),
			hashSpruceDir: this.cwd,
			log,
			...options,
		})

		for (const plugin of plugins) {
			void plugin(skill)
		}

		this.skills.push(skill)

		return skill
	}

	protected static async bootSkill(options?: SkillFactoryOptions) {
		const skill = this.Skill(options)
		void skill.execute()

		do {
			await this.wait(500)
		} while (!skill.isBooted() && skill.isRunning())

		return skill
	}

	protected static async bootAndRegisterSkill(
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
		return {
			id: '1234',
			dateCreated: new Date().getTime(),
			target: {},
			source: {},
			classification: 'incoming',
			...values,
		} as Message & T
	}
}
