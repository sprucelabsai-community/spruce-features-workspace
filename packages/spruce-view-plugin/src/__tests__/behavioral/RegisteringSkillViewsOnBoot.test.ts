import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import {
	eventContractUtil,
	eventErrorAssertUtil,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { diskUtil, Skill } from '@sprucelabs/spruce-skill-utils'
import { vcDiskUtil } from '@sprucelabs/spruce-test-fixtures'
import { assert, test } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import { ViewFeature } from '../../plugins/view.plugin'
import AbstractViewPluginTest from '../../tests/AbstractViewPluginTest'
import coreEventContracts, {
	CoreEventContract,
} from '../../tests/events.contract'

type RegisteredSkill = SpruceSchemas.Spruce.v2020_07_22.Skill

export default class RegistringSkillViewsOnBootTest extends AbstractViewPluginTest {
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

	@test()
	protected static async registersViewsOnBoot() {
		process.env.SHOULD_REGISTER_VIEWS = 'true'

		const skill = await this.GoodSkill()

		await this.bootSkill({ skill })

		const results = await this.getSkillViews(skill)
		const registered = eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isEqualDeep(registered.ids, ['book', 'book-form', 'spy'])
		assert.isFalsy(registered.theme)
	}

	@test()
	protected static async canControlRegisteringViewsWithEnvFlag() {
		const skill = await this.GoodSkill()
		const viewsPlugin = skill.getFeatureByCode('view') as ViewFeature

		//@ts-ignore
		viewsPlugin.importAndRegisterSkillViews = () => {
			throw Error('should not be hit')
		}

		await this.bootSkill({ skill })
	}

	@test()
	protected static async throwsHelpfulMessageWithBadSkillView() {
		process.env.SHOULD_REGISTER_VIEWS = 'true'
		const skill = await this.BadSkill()
		const err = await assert.doesThrowAsync(() => this.bootSkill({ skill }))
		errorAssertUtil.assertError(err, 'INVALID_VIEW_CONTROLLER')
	}

	@test()
	protected static async registersThemeWithSkillView() {
		process.env.SHOULD_REGISTER_VIEWS = 'true'
		const themeFile = vcDiskUtil.resolveThemeFile(
			this.resolveTestPathSrc('skill-with-theme', 'build')
		)

		assert.isString(themeFile)

		const expected = require(themeFile).default
		const skill = await this.GoodSkillWithTheme()

		await this.bootSkill({ skill })

		const results = await this.getSkillViews(skill)
		const registered = eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isTruthy(registered.theme)
		assert.isEqualDeep(registered.theme.props, expected)
	}

	private static async GoodSkill() {
		return this.TestSkillWithViewFilesInPlace('skill')
	}

	private static async GoodSkillWithTheme() {
		return this.TestSkillWithViewFilesInPlace('skill-with-theme')
	}

	private static async BadSkill() {
		return this.TestSkillWithViewFilesInPlace('broken-skill')
	}

	private static async TestSkillWithViewFilesInPlace(testDir: string) {
		const skill = await this.SkillFromTestDir(testDir)
		const source = this.resolveTestPathSrc(testDir, 'src')
		const destination = diskUtil.resolvePath(skill.rootDir, 'src')
		await diskUtil.copyDir(source, destination)
		return skill
	}

	private static async getSkillViews(skill: Skill) {
		const client = await this.connectToApi(skill)

		return await client.emit('heartwood.get-skill-views::v2021_02_11', {
			target: {
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
