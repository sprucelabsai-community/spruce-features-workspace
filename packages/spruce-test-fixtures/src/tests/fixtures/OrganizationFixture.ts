import { MercuryClient } from '@sprucelabs/mercury-client'
import { AddressFieldValue, assertOptions } from '@sprucelabs/schema'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { RoleBase } from '../../types/fixture.types'
import PersonFixture from './PersonFixture'
import RoleFixture from './RoleFixture'

export default class OrganizationFixture {
	private people: PersonFixture
	private organizations: { organization: any; client: MercuryClient }[] = []
	private orgCounter = process.pid
	private roles: RoleFixture

	public constructor(options: { people: PersonFixture; roles: RoleFixture }) {
		this.people = options.people
		this.roles = options.roles
	}

	public async seedDemoOrganization(
		values?: Partial<
			Omit<SpruceSchemas.Mercury.v2020_12_25.CreateOrgEmitPayload, 'slug'>
		> & {
			phone?: string
			slug?: string
		}
	) {
		const { phone, ...rest } = values ?? {}

		const allValues = {
			slug: this.generateOrgSlug(),
			name: `Organization from fixture - ${
				new Date().getTime() * Math.random()
			}`,
			address: {
				street1: `${Math.round(Math.random() * 9999)} Main St.`,
				city: 'Denver',
				province: 'CO',
				zip: '80212',
				country: 'USA',
			},
			...rest,
		}

		const { client } = await this.people.loginAsDemoPerson(phone)

		const [{ organization }] = await client.emitAndFlattenResponses(
			'create-organization::v2020_12_25',
			{
				payload: allValues,
			}
		)

		this.organizations.push({ organization, client })

		return organization
	}

	public async getOrganizationById(id: string) {
		const { client } = await this.people.loginAsDemoPerson()

		const [{ organization }] = await client.emitAndFlattenResponses(
			'get-organization::v2020_12_25',
			{
				target: {
					organizationId: id,
				},
			}
		)

		return organization
	}

	public async updateOrganization(
		id: string,
		values: {
			name?: string
			phone?: string
			address?: AddressFieldValue
			isPublic?: boolean
		}
	) {
		const { phone, ...payload } = values
		const { client } = await this.people.loginAsDemoPerson(phone)

		await client.emitAndFlattenResponses('update-organization::v2020_12_25', {
			target: {
				organizationId: id,
			},
			payload,
		})
	}

	public async getNewestOrganization(phone?: string) {
		const { client } = await this.people.loginAsDemoPerson(phone)

		const [{ organizations }] = await client.emitAndFlattenResponses(
			'list-organizations::v2020_12_25',
			{
				payload: {
					shouldOnlyShowMine: true,
					paging: {
						pageSize: 1,
					},
				},
			}
		)

		return organizations.pop() ?? null
	}

	private generateOrgSlug(): string {
		return `my-org-${new Date().getTime()}-${this.orgCounter++}`
	}

	public async installSkill(
		skillId: string,
		orgId: string,
		shouldNotifySkillOfInstall?: boolean
	): Promise<void> {
		const { client } = await this.people.loginAsDemoPerson()

		await client.emitAndFlattenResponses('install-skill::v2020_12_25', {
			target: {
				organizationId: orgId,
			},
			payload: {
				skillId,
				shouldNotifySkillOfInstall,
			},
		})
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
		roleBase: RoleBase
		organizationId: string
		personId: string
	}) {
		await this.roles.removeRoleFromPerson(options)
	}

	public async addPerson(options: {
		personId: string
		organizationId: string
		roleBase: RoleBase
		phone?: string
	}) {
		await this.roles.addRoleToPerson(options)
	}

	public async isSkillInstalled(skillId: string, organizationId: string) {
		const { client } = await this.people.loginAsDemoPerson()

		const [{ isInstalled }] = await client.emitAndFlattenResponses(
			'is-skill-installed::v2020_12_25',
			{
				target: {
					organizationId,
				},
				payload: {
					skillId,
				},
			}
		)

		return isInstalled
	}

	public async installSkillsByNamespace(options: {
		organizationId: string
		namespaces: string[]
		shouldNotifySkillOfInstall?: boolean
	}) {
		const {
			organizationId,
			namespaces,
			shouldNotifySkillOfInstall = false,
		} = options

		assertOptions(options, ['organizationId', 'namespaces'])

		const { client } = await this.people.loginAsDemoPerson()
		const [{ skills }] = await client.emitAndFlattenResponses(
			'list-skills::v2020_12_25',
			{
				payload: {
					namespaces,
				},
			}
		)

		await Promise.all(
			skills.map((skill) =>
				this.installSkill(skill.id, organizationId, shouldNotifySkillOfInstall)
			)
		)
	}

	public async deleteAllOrganizations(phone?: string) {
		const { client } = await this.people.loginAsDemoPerson(phone)
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
		const { client } = await this.people.loginAsDemoPerson(phone)

		const [{ organizations }] = await client.emitAndFlattenResponses(
			'list-organizations::v2020_12_25',
			{
				payload: {
					shouldOnlyShowMine: true,
				},
			}
		)

		return organizations
	}

	public async destroy() {
		await Promise.all(
			this.organizations.map(async ({ organization, client }) => {
				await client.emitAndFlattenResponses(
					'delete-organization::v2020_12_25',
					{
						target: {
							organizationId: organization.id,
						},
					}
				)
			})
		)

		this.organizations = []

		await this.people.destroy()
	}
}
