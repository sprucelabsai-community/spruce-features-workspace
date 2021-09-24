import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { SkillFactoryOptions } from '@sprucelabs/spruce-skill-booter'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import {
	MercuryFixture,
	AbstractSpruceFixtureTest,
} from '@sprucelabs/spruce-test-fixtures'
import plugin, { EventFeaturePlugin } from './../plugins/event.plugin'
import EventFixture from './fixtures/EventFixture'

export default class AbstractEventPluginTest extends AbstractSpruceFixtureTest {
	protected static async beforeEach() {
		await super.beforeEach()

		this.cwd = await this.generateSkillFromTestPath('skill')
		MercuryFixture.beforeEach()
		EventFeaturePlugin.shouldClientUseEventContracts(false)
	}

	protected static async generateSkillFromTestPath(
		dirName: string
	): Promise<string> {
		const source = this.resolveTestPath(dirName)
		const destination = this.resolveTestPath(`${new Date().getTime()}/skill`)

		await diskUtil.copyDir(source, destination)

		return destination
	}

	protected static async Skill(options?: SkillFactoryOptions) {
		const { plugins = [plugin] } = options ?? {}

		const skill = await super.Skill({
			plugins,
			...options,
		})

		return skill
	}

	protected static resolveTestPath(pathAfterTestDirsAndFiles: string) {
		return this.resolvePath(
			__dirname,
			'..',
			'__tests__',
			'testDirsAndFiles',
			pathAfterTestDirsAndFiles
		)
	}

	protected static EventFixture() {
		const fixture = new EventFixture({
			cwd: this.cwd,
			mercuryFixture: this.Fixture('mercury'),
			skillFixture: this.Fixture('skill'),
			SkillFactory: this.Skill.bind(this),
		})
		return fixture
	}

	protected static generateGoodContractFileForSkill(
		skill: SpruceSchemas.Spruce.v2020_07_22.Skill
	) {
		const fixture = this.EventFixture()
		return fixture.generateGoodContractFileForSkill(skill.slug)
	}
}
