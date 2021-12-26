import { MercuryClient } from '@sprucelabs/mercury-client'
import { assertOptions } from '@sprucelabs/schema'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import PersonFixture from './PersonFixture'
import RoleFixture from './RoleFixture'

export default class OrganizationFixture {
	private personFixture: PersonFixture
	private organizations: { organization: any; client: MercuryClient }[] = []
	private orgCounter = process.pid
	private roles: RoleFixture

	public constructor(options: {
		personFixture: PersonFixture
		roleFixture: RoleFixture
	}) {
		this.personFixture = options.personFixture
		this.roles = options.roleFixture
	}

	public async seedDemoOrganization(
		values?: Omit<
			SpruceSchemas.Mercury.v2020_12_25.CreateOrgEmitPayload,
			'slug'
		> & {
			phone?: string
			slug?: string
		}
	) {
		const { phone, ...rest } = values ?? {}

		const allValues = {
			slug: this.generateOrgSlug(),
			name: 'Organization from fixture',
			address: {
				street1: `${Math.round(Math.random() * 9999)} Main St.`,
				city: 'Denver',
				province: 'CO',
				zip: '80212',
				country: 'USA',
			},
			...rest,
		}

		const { client } = await this.personFixture.loginAsDemoPerson(phone)

		const results = await client.emit('create-organization::v2020_12_25', {
			payload: allValues,
		})

		const { organization } = eventResponseUtil.getFirstResponseOrThrow(results)

		this.organizations.push({ organization, client })

		return organization
	}

	public async getOrganizationById(id: string) {
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('get-organization::v2020_12_25', {
			target: {
				organizationId: id,
			},
		})

		const { organization } = eventResponseUtil.getFirstResponseOrThrow(results)

		return organization
	}

	public async getNewestOrganization(phone?: string) {
		const { client } = await this.personFixture.loginAsDemoPerson(phone)

		const results = await client.emit('list-organizations::v2020_12_25', {
			payload: {
				shouldOnlyShowMine: true,
			},
		})

		const { organizations } = eventResponseUtil.getFirstResponseOrThrow(results)

		return organizations.pop() ?? null
	}

	private generateOrgSlug(): string {
		return `my-org-${new Date().getTime()}-${this.orgCounter++}`
	}

	public async installSkill(skillId: string, orgId: string): Promise<void> {
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

	public async isPartOfOrg(options: {
		personId: string
		organizationId: string
		phone?: string
	}) {
		const roles = await this.roles.listRoles({
			...options,
		})

		return roles.length > 0
	}

	public async removePerson(options: {
		phone?: string
		roleBase: string
		organizationId: string
		personId: string
	}) {
		await this.roles.removeRoleFromPerson(options)
	}

	public async addPerson(options: {
		personId: string
		organizationId: string
		roleBase: string
		phone?: string
	}) {
		await this.roles.addRoleToPerson(options)
	}

	public async isSkillInstalled(skillId: string, organizationId: string) {
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('is-skill-installed::v2020_12_25', {
			target: {
				organizationId,
			},
			payload: {
				skillId,
			},
		})

		const { isInstalled } = eventResponseUtil.getFirstResponseOrThrow(results)

		return isInstalled
	}

	public async installSkillsByNamespace(options: {
		organizationId: string
		namespaces: string[]
	}) {
		const { organizationId, namespaces } = options

		assertOptions(options, ['organizationId', 'namespaces'])

		const { client } = await this.personFixture.loginAsDemoPerson()
		const skillResults = await client.emit('list-skills::v2020_12_25', {
			payload: {
				namespaces,
			},
		})

		const { skills } = eventResponseUtil.getFirstResponseOrThrow(skillResults)

		await Promise.all(
			skills.map((skill) => this.installSkill(skill.id, organizationId))
		)
	}

	public async deleteAllOrganizations(phone?: string) {
		const { client } = await this.personFixture.loginAsDemoPerson(phone)
		const organizations = await this.listOrganizations(phone)

		await Promise.all(
			organizations.map((org) =>
				client.emit('delete-organization::v2020_12_25', {
					target: {
						organizationId: org.id,
					},
				})
			)
		)
	}

	public async listOrganizations(phone?: string) {
		const { client } = await this.personFixture.loginAsDemoPerson(phone)

		const results = await client.emit('list-organizations::v2020_12_25', {
			payload: {
				shouldOnlyShowMine: true,
			},
		})

		const { organizations } = eventResponseUtil.getFirstResponseOrThrow(results)

		return organizations
	}

	public async destroy() {
		await Promise.all(
			this.organizations.map(async ({ organization, client }) => {
				const results = await client.emit('delete-organization::v2020_12_25', {
					target: {
						organizationId: organization.id,
					},
				})

				eventResponseUtil.getFirstResponseOrThrow(results)
			})
		)

		await this.personFixture.destroy()
	}
}
