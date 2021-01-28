import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class RegisteringEventsOnBootTest extends AbstractEventPluginTest {
	@test()
	protected static async noEventsToStart() {
		const contracts = await this.register2SkillsInstallAtOrgAndBootSkill()

		assert.isLength(contracts, 1)
	}

	@test()
	protected static async registersEventsOnBoot() {
		this.cwd = this.resolveTestPath('skill')

		const contracts = await this.register2SkillsInstallAtOrgAndBootSkill(
			async (skill) => {
				this.generateGoodContractFileForSkill(skill)
			}
		)

		assert.isLength(contracts, 2)
	}

	private static generateGoodContractFileForSkill(skill: any) {
		const sourceContents = diskUtil.readFile(
			this.resolvePath('src', '.spruce', 'events', 'source.events.contract.js')
		)
		const updatedContents = sourceContents.replace('{{namespace}}', skill.slug)
		const destination = this.resolvePath(
			'src',
			'.spruce',
			'events',
			'events.contract.js'
		)
		diskUtil.writeFile(destination, updatedContents)
	}

	private static async register2SkillsInstallAtOrgAndBootSkill(
		afterRegisterSkillHandler?: (skill: any) => Promise<void>
	) {
		const registeredSkill = await this.Fixture('skill').seedDemoSkill({
			name: 'my great skill',
		})

		await afterRegisterSkillHandler?.(registeredSkill)

		process.env.SKILL_ID = registeredSkill.id
		process.env.SKILL_API_KEY = registeredSkill.apiKey

		await this.bootSkill()

		const orgs = this.Fixture('organization')

		const [{ skill: skill2, client }, org] = await Promise.all([
			await this.Fixture('skill').loginAsDemoSkill({
				name: 'a killer skill',
			}),
			await orgs.seedDemoOrg({ name: 'my new org' }),
		])

		await Promise.all([
			orgs.installSkill(registeredSkill.id, org.id),
			orgs.installSkill(skill2.id, org.id),
		])

		const results = await client.emit('get-event-contracts::v2020_12_25')

		const payload = eventResponseUtil.getFirstResponseOrThrow(results)
		const contracts = payload.contracts
		return contracts
	}
}
