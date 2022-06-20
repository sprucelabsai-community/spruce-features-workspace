import { MercuryClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { test, assert } from '@sprucelabs/test'
import { errorAssert, generateId } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import { SeedDemoSkillValues } from '../../../tests/fixtures/SkillFixture'

@fake.login()
export default class FakingSkillEventsTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async canSeedSkill() {
		const skill = await this.seedDemoSkill()
		assert.isEqual(skill.creators[0].personId, this.fakedOwner.id)
	}

	@test()
	protected static async skillsGenerateUniqueValues() {
		const skill1 = await this.seedDemoSkill()
		const skill2 = await this.seedDemoSkill()

		assert.isNotEqual(skill1.id, skill2.id)
		assert.isNotEqual(skill1.slug, skill2.slug)
		assert.isNotEqual(skill1.name, skill2.name)
		assert.isNotEqual(skill1.apiKey, skill2.apiKey)
	}

	@test()
	protected static async seededSkillsAvailableLocally() {
		const skill1 = await this.seedDemoSkill()
		assert.isEqualDeep(this.fakedSkills, [skill1])
		const skill2 = await this.seedDemoSkill()
		assert.isEqualDeep(this.fakedSkills, [skill2, skill1])
	}

	@test()
	protected static async authenticateThrowsWhenBadAuth() {
		const err = await assert.doesThrowAsync(() =>
			this.emitAuthenticateAsSkill('', '')
		)

		errorAssert.assertError(err, 'INVALID_AUTH_TOKEN')
	}

	@test()
	protected static async authenticateThrowsWhenBadAuthId() {
		const skill = await this.seedDemoSkill()
		const err = await assert.doesThrowAsync(() =>
			this.emitAuthenticateAsSkill(skill.apiKey, generateId())
		)

		errorAssert.assertError(err, 'INVALID_AUTH_TOKEN')
	}

	@test()
	protected static async canAuthenticateAsSkill() {
		const skill = await this.seedDemoSkill()
		const { type } = await this.emitAuthenticateAsSkill(skill.apiKey, skill.id)
		assert.isEqual(type, 'authenticated')
	}

	@test()
	protected static async returnsTheExpectedSkill() {
		const skill1 = await this.seedDemoSkill()
		const skill2 = await this.seedDemoSkill()
		await this.assertCanAuthAsSkill(skill1)
		await this.assertCanAuthAsSkill(skill2)
	}

	@test()
	protected static async skillSeedsWithPassedValues() {
		const skill1 = await this.seedDemoSkill({
			name: 'taco',
			slug: 'bravo',
		})

		assert.isEqual(skill1.name, 'taco')
		assert.isEqual(skill1.slug, 'bravo')
	}

	@test()
	protected static async whoAmIReturnsSkill() {
		const { client, skill } = await this.skills.loginAsDemoSkill({
			name: 'Testing login',
		})
		await this.assertExpectedWhoAmIResults(client, skill)
	}

	@test()
	protected static async whoAmIReturnsSkillExpectedSkill() {
		const { client, skill } = await this.skills.loginAsDemoSkill({
			name: 'Testing login',
		})

		await this.seedDemoSkill()
		await this.assertExpectedWhoAmIResults(client, skill)
	}

	@test()
	protected static async returnsCurrentSkillIfEnvSet() {
		const skillId = generateId()
		const apiKey = generateId()
		process.env.SKILL_ID = skillId
		process.env.SKILL_API_KEY = apiKey

		const client = await this.mercury.connectToApi()
		const [{ type, auth }] = await client.emitAndFlattenResponses(
			'authenticate::v2020_12_25',
			{
				payload: {
					skillId,
					apiKey,
				},
			}
		)

		const { skill } = auth

		assert.isEqual(type, 'authenticated')
		assert.isEqual(skill?.id, skillId)
		assert.isEqual(skill?.apiKey, apiKey)
	}

	private static async assertExpectedWhoAmIResults(
		client: MercuryClient,
		skill: SpruceSchemas.Spruce.v2020_07_22.Skill
	) {
		const [{ type, auth }] = await client.emitAndFlattenResponses(
			'whoami::v2020_12_25'
		)

		assert.isEqual(type, 'authenticated')
		assert.isEqualDeep(auth.skill, skill)
	}

	private static async seedDemoSkill(values?: SeedDemoSkillValues) {
		return await this.skills.seedDemoSkill(values)
	}

	private static async assertCanAuthAsSkill(
		skill1: SpruceSchemas.Spruce.v2020_07_22.Skill
	) {
		const { auth } = await this.emitAuthenticateAsSkill(
			skill1.apiKey,
			skill1.id
		)

		assert.isEqualDeep(auth.skill, skill1)
	}

	private static async emitAuthenticateAsSkill(
		apiKey: string,
		skillId: string
	) {
		const [{ auth, type }] = await this.client.emitAndFlattenResponses(
			'authenticate::v2020_12_25',
			{
				payload: {
					apiKey,
					skillId,
				},
			}
		)

		return { auth, type }
	}

	private static get client() {
		return fake.getClient()
	}
}
