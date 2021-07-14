import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { SkillFactoryOptions } from '@sprucelabs/spruce-skill-booter'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import {
	MercuryFixture,
	AbstractSpruceFixtureTest,
} from '@sprucelabs/spruce-test-fixtures'
import plugin, { EventFeaturePlugin } from './../plugins/event.plugin'

export default class AbstractEventPluginTest extends AbstractSpruceFixtureTest {
	protected static async beforeEach() {
		await super.beforeEach()

		this.cwd = await this.generateSkillFromTestPath('skill')
		MercuryFixture.beforeEach()
		EventFeaturePlugin.shouldClientUseEventContracts(false)
	}

	protected static async generateSkillFromTestPath(
		testDirName: string
	): Promise<string> {
		const destination = diskUtil.createRandomTempDir()
		const source = this.resolveTestPath(testDirName)

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

	protected static generateGoodContractFileForSkill(
		skill: SpruceSchemas.Spruce.v2020_07_22.Skill
	) {
		const sourceContents = diskUtil.readFile(
			this.resolvePath(
				'build',
				'.spruce',
				'events',
				'source.events.contract.js'
			)
		)

		const updatedContents = sourceContents.replace('{{namespace}}', skill.slug)
		const destination = this.resolvePath(
			'build',
			'.spruce',
			'events',
			'events.contract.js'
		)

		diskUtil.writeFile(destination, updatedContents)
	}
}
