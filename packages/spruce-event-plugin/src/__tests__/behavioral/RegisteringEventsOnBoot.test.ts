import {
	eventContractUtil,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { MercuryFixture } from '@sprucelabs/spruce-test-fixtures'
import { assert, test } from '@sprucelabs/test'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'
export default class RegisteringEventsOnBootTest extends AbstractEventPluginTest {
	protected static async beforeEach() {
		await super.beforeEach()
		MercuryFixture.setShouldAutoImportContracts(false)
	}

	@test()
	protected static async noEventsRegisteredWhenNoEventsCreated() {
		this.cwd = await this.generateSkillFromTestPath('empty-skill')

		const { contracts, currentSkill: currentSkill } =
			await this.register2SkillsInstallAtOrgAndBootSkill()
		assert.isFalse(this.doesIncudeEventBySkill(contracts, currentSkill))
	}

	@test()
	protected static async badMercuryUrlCrashesSkillAsExpected() {
		process.env.HOST = 'aoeu'
		await assert.doesThrowAsync(() => this.bootSkill())
	}

	@test()
	protected static async registersEventsOnBoot() {
		const { contracts, currentSkill: currentSkill } =
			await this.register2SkillsInstallAtOrgAndBootSkill(async (skill) => {
				this.generateGoodContractFileForSkill(skill)
			})

		assert.isTrue(
			this.doesIncudeEventBySkill(contracts, currentSkill),
			'Event contract missing event registered by current skill'
		)
	}

	@test('will register listeners if env is not set', undefined, 3)
	@test('wont re-register listeners if env is set', 'true', 2)
	protected static async wontRegisterTheSecondTimeBecauseFilesHaveNotChanged(
		shouldCache: string | undefined,
		expectedRegisterCount: number
	) {
		process.env.SHOULD_CACHE_EVENT_REGISTRATIONS = shouldCache
		const currentSkill = await this.registerCurrentSkill()
		this.generateGoodContractFileForSkill(currentSkill)
		const client = await this.Fixture('mercury').connectToApi()

		let registerEventCount = 0
		await client.on('register-events::v2020_12_25', async () => {
			registerEventCount++
			return { fqens: ['empty'] }
		})

		await this.bootSkill()
		await this.bootSkill()
		this.generateGoodContractFileForSkill(currentSkill)
		await this.bootSkill()

		assert.isEqual(registerEventCount, expectedRegisterCount)
	}

	@test()
	protected static async canBootSkill20TimesAtOnce() {
		const currentSkill = await this.registerCurrentSkill()
		this.generateGoodContractFileForSkill(currentSkill)

		const promises = Array(20)
			.fill(0)
			.map(() => {
				return this.bootSkill()
			})

		await Promise.all(promises)
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
		const currentSkill = await this.registerCurrentSkill()

		await afterRegisterSkillHandler?.(currentSkill)

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

		return { contracts, currentSkill, skill2 }
	}

	private static async registerCurrentSkill() {
		const currentSkill = await this.Fixture('skill').seedDemoSkill({
			name: 'my great skill',
		})

		process.env.SKILL_ID = currentSkill.id
		process.env.SKILL_API_KEY = currentSkill.apiKey
		return currentSkill
	}
}
