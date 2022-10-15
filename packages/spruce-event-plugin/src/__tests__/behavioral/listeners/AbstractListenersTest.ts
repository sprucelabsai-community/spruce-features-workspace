import { Skill as RegisteredSkill } from '@sprucelabs/spruce-core-schemas'
import { Skill } from '@sprucelabs/spruce-skill-utils'
import { MercuryFixture } from '@sprucelabs/spruce-test-fixtures'
import AbstractEventPluginTest from '../../../tests/AbstractEventPluginTest'
import { RegisterSkillSetupListenerOptions } from '../../../tests/fixtures/EventFixture'

export default abstract class AbstractListenerTest extends AbstractEventPluginTest {
	protected static skill: Skill
	protected static registeredSkill: RegisteredSkill

	protected static async beforeEach() {
		await super.beforeEach()

		MercuryFixture.setShouldMixinCoreEventContractsWhenImportingLocal(true)

		delete process.env.DID_BOOT_FIRED
		delete process.env.WILL_BOOT_FIRED
		delete process.env.DID_BOOT_FIRED_2
		delete process.env.WILL_BOOT_FIRED_2
		delete process.env.TO_COPY_SKILL_API_KEY
		delete process.env.TO_COPY_SKILL_ID
	}

	protected static async registerSkillAndSetupListeners(
		options?: RegisterSkillSetupListenerOptions
	) {
		const results = await this.EventFixture().registerSkillAndSetupListeners(
			options
		)

		const { currentSkill, loggedInSkill } = results

		this.skill = currentSkill
		this.registeredSkill = loggedInSkill

		return results
	}

	protected static async bootSkillNamed(name: string) {
		await this.setCwdToTestSkill(name)
		return this.setupListenersAndBoot()
	}

	protected static async setCwdToTestSkill(name: string) {
		this.cwd = await this.generateSkillFromTestPath(name)
	}

	protected static async setupListenersAndBoot() {
		const results = await this.registerSkillAndSetupListeners()
		await this.bootSkill({ skill: this.skill })
		return results
	}
}
