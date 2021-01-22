import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { ApiClientFactory } from '../types/fixture.types'
import PersonFixture from './PersonFixture'

type Skill = SpruceSchemas.Spruce.v2020_07_22.Skill
export class SkillFixture<
	Factory extends ApiClientFactory = ApiClientFactory,
	ClientPromise extends ReturnType<Factory> = ReturnType<Factory>,
	Client = ClientPromise extends PromiseLike<infer C> ? C : ClientPromise
> {
	private personFixture: PersonFixture
	private apiClientFactory: Factory

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

		const skillClient = await this.apiClientFactory()

		await skillClient.emit('authenticate::v2020_12_25', {
			payload: {
				skillId: skill.id,
				apiKey: skill.apiKey,
			},
		})

		return { skill, client: skillClient }
	}

	public async destory() {
		await this.personFixture.destroy()
	}
}
