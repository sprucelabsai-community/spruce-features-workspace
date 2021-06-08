import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import {
	eventContractUtil,
	eventErrorAssertUtil,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { diskUtil, Skill } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import AbstractViewTest from '../../tests/AbstractViewTest'
import coreEventContracts, {
	CoreEventContract,
} from '../../tests/events.contract'

type RegisteredSkill = SpruceSchemas.Spruce.v2020_07_22.Skill

export default class RegistringSkillViewsOnBootTest extends AbstractViewTest {
	private static currentSkill: RegisteredSkill

	protected static async beforeEach() {
		await super.beforeEach()
		const combined = eventContractUtil.unifyContracts(coreEventContracts as any)
		assert.isTruthy(combined)

		MercuryClientFactory.setDefaultContract(combined)

		this.currentSkill = await this.seedAndRegisterCurrentSkill()
	}

	@test()
	protected static async registersNothingToStart() {
		const skill = await this.bootSkill()
		const results = await this.getSkillViews(skill)

		eventErrorAssertUtil.assertErrorFromResponse(
			results,
			'SKILL_VIEWS_NOT_FOUND',
			{
				namespace: this.currentSkill.slug,
			}
		)
	}

	@test.only()
	protected static async registersViewsOnBoot() {
		this.cwd = this.resolveTestPath('src', 'skill-source')
		debugger
		const skill = await this.bootSkill()

		debugger

		const results = await this.getSkillViews(skill)

		const { ids } = eventResponseUtil.getFirstResponseOrThrow(results)
	}

	protected static resolveTestPath(
		buildOrSrc: 'build' | 'src',
		...pathAfterTestDirsAndFiles: string[]
	) {
		return this.resolvePath(
			__dirname,
			'..',
			'..',
			'..',
			buildOrSrc,
			'__tests__',
			'testDirsAndFiles',
			...pathAfterTestDirsAndFiles
		)
	}

	private static async getSkillViews(skill: Skill) {
		const client = await this.connectToApi(skill)

		return await client.emit('heartwood.get-skill-views::v2021_02_11', {
			payload: {
				namespace: this.currentSkill.slug,
			},
		})
	}

	private static async connectToApi(skill: Skill) {
		const events = skill.getFeatureByCode('event') as EventFeature
		const client =
			(await events.connectToApi()) as MercuryClient<CoreEventContract>
		return client
	}

	private static async seedAndRegisterCurrentSkill() {
		const currentSkill = await this.Fixture('skill').seedDemoSkill({
			name: 'my skill with events',
		})

		process.env.SKILL_ID = currentSkill.id
		process.env.SKILL_API_KEY = currentSkill.apiKey
		return currentSkill
	}
}
