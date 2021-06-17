import { MercuryClient } from '@sprucelabs/mercury-client'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import SpruceError from '../../errors/SpruceError'
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

	public async isPartOfOrg(personId: string, orgId: string) {
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('list-roles::v2020_12_25', {
			payload: {
				shouldIncludePrivateRoles: true,
			},
			target: {
				organizationId: orgId,
				personId,
			},
		})

		const { roles } = eventResponseUtil.getFirstResponseOrThrow(results)

		return roles.length > 0
	}

	public async addPerson(options: {
		personId: string
		organizationId: string
		roleBase: string
	}) {
		const { personId, organizationId, roleBase } = options

		const { client } = await this.personFixture.loginAsDemoPerson()

		const roleResults = await client.emit('list-roles::v2020_12_25', {
			payload: {
				shouldIncludePrivateRoles: true,
			},
			target: {
				organizationId,
			},
		})

		const { roles } = eventResponseUtil.getFirstResponseOrThrow(roleResults)

		const match = roles.find((r) => r.base === roleBase)

		if (!match) {
			throw Error(`Could not find role based on ${roleBase}.`)
		}

		const roleId = match.id

		const setRoleResults = await client.emit('set-role::v2020_12_25', {
			target: {
				organizationId,
			},
			payload: {
				personId,
				roleId,
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(setRoleResults)
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

	public async installSkillsBySlug(options: {
		organizationId: string
		slugs: string[]
	}) {
		const { organizationId, slugs } = options
		const { client } = await this.personFixture.loginAsDemoPerson()
		const skillResults = await client.emit('list-skills::v2020_12_25')
		const { skills } = eventResponseUtil.getFirstResponseOrThrow(skillResults)

		for (const slug of slugs) {
			const match = skills.find((s) => s.slug === slug)

			if (!match) {
				throw new SpruceError({ code: 'SKILL_NOT_FOUND', slug })
			}

			await this.installSkill(match.id, organizationId)
		}
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
