import { MercuryClient } from '@sprucelabs/mercury-client'
import { SpruceError } from '@sprucelabs/schema'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { ApiClientFactory } from '../../types/fixture.types'
import PersonFixture from './PersonFixture'

type Skill = SpruceSchemas.Spruce.v2020_07_22.Skill
type Factory = ApiClientFactory
type Client = MercuryClient

export default class SkillFixture {
	private personFixture: PersonFixture
	private apiClientFactory: Factory
	private skills: { client: MercuryClient; skill: Skill }[] = []
	private skillCounter = process.pid

	public constructor(personFixture: PersonFixture, apiClientFactory: Factory) {
		this.apiClientFactory = apiClientFactory
		this.personFixture = personFixture
	}

	public async seedDemoSkill(values: { name: string; slug?: string }) {
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('register-skill::v2020_12_25', {
			payload: {
				slug: this.generateSkillSlug(),
				...values,
			},
		})

		const { skill } = eventResponseUtil.getFirstResponseOrThrow(results)

		this.skills.push({ client, skill })

		return skill as Skill
	}

	private generateSkillSlug(): string | null | undefined {
		return `my-skill-${new Date().getTime()}-${this.skillCounter++}`
	}

	public async loginAsDemoSkill(values: {
		name: string
		slug?: string
	}): Promise<{ skill: Skill; client: Client }> {
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('register-skill::v2020_12_25', {
			payload: {
				slug: this.generateSkillSlug(),
				...values,
			},
		})

		const { skill } = eventResponseUtil.getFirstResponseOrThrow(results)

		const skillClient = (await this.apiClientFactory()) as any

		await skillClient.authenticate({
			skillId: skill.id,
			apiKey: skill.apiKey,
		})

		return { skill, client: skillClient }
	}

	public async loginAsCurrentSkill(): Promise<{
		client: Client
		skill: Skill
	}> {
		const missing: string[] = []

		if (!process.env.SKILL_ID) {
			missing.push('env.SKILL_ID')
		}

		if (!process.env.SKILL_API_KEY) {
			missing.push('env.SKILL_API_KEY')
		}

		if (missing.length > 0) {
			throw new SpruceError({
				code: 'MISSING_PARAMETERS',
				parameters: missing,
			})
		}

		const client = await this.apiClientFactory()
		//@tsi-ignore
		let skill = client.auth?.skill

		if (!skill) {
			const auth = await client.authenticate({
				skillId: process.env.SKILL_ID,
				apiKey: process.env.SKILL_API_KEY,
			})
			skill = auth.skill
		}

		if (!skill) {
			throw new SpruceError({
				code: 'INVALID_PARAMETERS',
				parameters: ['env.SKILL_ID', 'env.SKILL_API_KEY'],
			})
		}

		return {
			client,
			skill: {
				...skill,
				apiKey: process.env.SKILL_API_KEY as string,
			},
		}
	}

	public async destroy() {
		for (const { skill, client } of this.skills) {
			const results = await client.emit('unregister-skill::v2020_12_25', {
				target: {
					skillId: skill.id,
				},
			})

			eventResponseUtil.getFirstResponseOrThrow(results)
		}

		this.skills = []
	}
}
