import { MercuryClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { ApiClientFactory } from '../types/fixture.types'
import PersonFixture from './PersonFixture'

type Skill = SpruceSchemas.Spruce.v2020_07_22.Skill
export default class SkillFixture<
	Factory extends ApiClientFactory = ApiClientFactory,
	Client extends MercuryClient = MercuryClient
> {
	private personFixture: PersonFixture
	private apiClientFactory: Factory
	private skills: { client: MercuryClient; skill: Skill }[] = []

	public constructor(personFixture: PersonFixture, apiClientFactory: Factory) {
		this.apiClientFactory = apiClientFactory
		this.personFixture = personFixture
	}

	public async seedDemoSkill(values: { name: string; slug?: string }) {
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('register-skill::v2020_12_25', {
			payload: {
				slug: `my-skill-${new Date().getTime()}`,
				...values,
			},
		})

		const { skill } = eventResponseUtil.getFirstResponseOrThrow(results)

		this.skills.push({ client, skill })

		return skill as Skill
	}

	public async loginAsDemoSkill(values: {
		name: string
		slug?: string
	}): Promise<{ skill: Skill; client: Client }> {
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('register-skill::v2020_12_25', {
			payload: {
				slug: `my-skill-${new Date().getTime()}`,
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
