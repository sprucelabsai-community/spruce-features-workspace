import {
	eventContractUtil,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { assert, test } from '@sprucelabs/test'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'
export default class RegisteringEventsOnBootTest extends AbstractEventPluginTest {
	@test()
	protected static async noEventsRegisteredWhenNoEventsCreated() {
		this.cwd = await this.generateSkillFromTestPath('empty-skill')

		const { contracts, registeredSkill } =
			await this.register2SkillsInstallAtOrgAndBootSkill()
		assert.isFalse(this.doesIncudeEventBySkill(contracts, registeredSkill))
	}

	@test()
	protected static async badMercuryUrlCrashesSkillAsExpected() {
		process.env.HOST = 'aoeu'
		await assert.doesThrowAsync(() => this.bootSkill())
	}

	@test()
	protected static async registersEventsOnBoot() {
		const { contracts, registeredSkill } =
			await this.register2SkillsInstallAtOrgAndBootSkill(async (skill) => {
				this.generateGoodContractFileForSkill(skill)
			})

		assert.isTrue(
			this.doesIncudeEventBySkill(contracts, registeredSkill),
			'Event contract missing event registered by current skill'
		)
	}

	private static doesIncudeEventBySkill(contracts: any, registeredSkill: any) {
		const unified = eventContractUtil.unifyContracts(contracts)
		const names = eventContractUtil.getEventNames(
			unified ?? { eventSignatures: {} },
			registeredSkill.slug
		)

		return names.length > 0
	}

	private static async register2SkillsInstallAtOrgAndBootSkill(
		afterRegisterSkillHandler?: (skill: any) => Promise<void>
	) {
		const currentSkill = await this.Fixture('skill').seedDemoSkill({
			name: 'my great skill',
		})

		await afterRegisterSkillHandler?.(currentSkill)

		process.env.SKILL_ID = currentSkill.id
		process.env.SKILL_API_KEY = currentSkill.apiKey

		await this.bootSkill()

		const orgs = this.Fixture('organization')

		const [{ skill: skill2, client }, org] = await Promise.all([
			await this.Fixture('skill').loginAsDemoSkill({
				name: 'a killer skill',
			}),
			await orgs.seedDemoOrg({ name: 'my new org' }),
		])

		await Promise.all([
			orgs.installSkill(currentSkill.id, org.id),
			orgs.installSkill(skill2.id, org.id),
		])

		const results = await client.emit('get-event-contracts::v2020_12_25')

		const payload = eventResponseUtil.getFirstResponseOrThrow(results)
		const contracts = payload.contracts

		return { contracts, registeredSkill: currentSkill, skill2 }
	}
}
