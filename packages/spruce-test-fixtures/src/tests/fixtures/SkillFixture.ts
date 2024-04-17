import { MercuryClient } from '@sprucelabs/mercury-client'
import { SchemaError } from '@sprucelabs/schema'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { TestConnectFactory } from '../../types/fixture.types'
import PersonFixture from './PersonFixture'

type Skill = SpruceSchemas.Spruce.v2020_07_22.Skill
type Factory = TestConnectFactory
type Client = MercuryClient

export interface SeedDemoSkillValues {
    name?: string
    slug?: string
    creatorPhone?: string
}

export default class SkillFixture {
    private personFixture: PersonFixture
    private connectToApi: Factory
    private skills: { client: MercuryClient; skill: Skill }[] = []
    private skillCounter = process.pid

    public constructor(options: {
        personFixture: PersonFixture
        connectToApi: Factory
    }) {
        this.connectToApi = options.connectToApi
        this.personFixture = options.personFixture
    }

    public async seedDemoSkill(options?: SeedDemoSkillValues) {
        const { creatorPhone, ...values } = options ?? {}

        const { client } =
            await this.personFixture.loginAsDemoPerson(creatorPhone)

        const [{ skill }] = await client.emitAndFlattenResponses(
            'register-skill::v2020_12_25',
            {
                payload: {
                    slug: this.generateSkillSlug(),
                    name: this.generateSkillName(),
                    ...values,
                },
            }
        )

        this.skills.push({ client, skill })

        return skill as Skill
    }

    private generateSkillName() {
        return `Seeded skill ` + this.skillCounter
    }

    private generateSkillSlug(): string {
        return `seed-skill-${Math.round(
            new Date().getTime() * Math.random()
        )}-${this.skillCounter++}`
    }

    public async loginAsDemoSkill(values: {
        name: string
        slug?: string
    }): Promise<{ skill: Skill; client: Client }> {
        const skill = await this.seedDemoSkill({
            slug: this.generateSkillSlug(),
            ...values,
            name: `${values.name} (SkillFixture)`,
        })

        const skillClient = (await this.connectToApi({
            shouldReUseClient: false,
        })) as Client

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
            throw new SchemaError({
                code: 'MISSING_PARAMETERS',
                parameters: missing,
            })
        }

        const client = await this.connectToApi({
            shouldReUseClient: false,
        })

        //@ts-ignore
        let skill = client.auth?.skill

        if (!skill) {
            const auth = await client.authenticate({
                skillId: process.env.SKILL_ID,
                apiKey: process.env.SKILL_API_KEY,
            })
            skill = auth.skill
        }

        if (!skill) {
            throw new SchemaError({
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
        await Promise.all(
            this.skills.map(async ({ skill, client }) =>
                client.emit('unregister-skill::v2020_12_25', {
                    target: {
                        skillId: skill.id,
                    },
                })
            )
        )

        this.skills = []
    }
}
