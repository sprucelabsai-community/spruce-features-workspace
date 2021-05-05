import { MercuryClient } from '@sprucelabs/mercury-client'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import PersonFixture from './PersonFixture'

export default class OrganizationFixture {
	private personFixture: PersonFixture
	private organizations: { organization: any; client: MercuryClient }[] = []

	public constructor(personFixture: PersonFixture) {
		this.personFixture = personFixture
	}

	public async seedDemoOrg(values: { name: string; slug?: string }) {
		const allValues = {
			slug: `my-org-${new Date().getTime()}`,
			...values,
		}

		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('create-organization::v2020_12_25', {
			payload: allValues,
		})

		const { organization } = eventResponseUtil.getFirstResponseOrThrow(results)

		this.organizations.push({ organization, client })

		return organization
	}

	public async installSkill(skillId: string, orgId: any): Promise<void> {
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('install-skill::v2020_12_25', {
			target: {
				organizationId: orgId,
			},
			payload: {
				skillId,
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(results)
	}

	public async destory() {
		for (const { organization, client } of this.organizations) {
			const results = await client.emit('delete-organization::v2020_12_25', {
				target: {
					organizationId: organization.id,
				},
			})

			eventResponseUtil.getFirstResponseOrThrow(results)
		}

		await this.personFixture.destroy()
	}
}
