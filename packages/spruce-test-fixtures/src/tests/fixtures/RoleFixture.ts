import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { SchemaError } from '@sprucelabs/schema'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'
import PersonFixture from './PersonFixture'

type GetNewestOrgHandler =
	() => Promise<SpruceSchemas.Spruce.v2020_07_22.Organization | null>

export default class RoleFixture {
	private personFixture: PersonFixture
	private getNewestOrgHandler: GetNewestOrgHandler

	public constructor(options: {
		personFixture: PersonFixture
		getNewestOrg: GetNewestOrgHandler
	}) {
		this.personFixture = options.personFixture
		this.getNewestOrgHandler = options.getNewestOrg
	}

	public async listRoles(options?: {
		organizationId?: string
		locationId?: string
		personId?: string
		phone?: string
	}) {
		let { organizationId, locationId, personId, phone } = options ?? {}

		const { client } = await this.personFixture.loginAsDemoPerson(phone)

		if (!organizationId && !locationId) {
			const latest = await this.getNewestOrgHandler()
			organizationId = latest?.id
		}

		if (!organizationId && !locationId) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['organizationId'],
				friendlyMessage:
					"You gotta @seed('organizations',1) before listing roles!",
			})
		}

		const results = await client.emit('list-roles::v2020_12_25', {
			target: {
				organizationId,
				personId,
				locationId,
			},
			payload: {
				shouldIncludePrivateRoles: true,
			},
		})

		const { roles } = eventResponseUtil.getFirstResponseOrThrow(results)

		return roles
	}

	public async addRoleToPerson(options: {
		personId: string
		organizationId: string
		locationId?: string
		roleBase: string
		phone?: string
	}) {
		const { personId, organizationId, locationId, roleBase, phone } = options

		const { client } = await this.personFixture.loginAsDemoPerson(phone)

		const match = await this.fetchFirstRoleWithBase({
			organizationId,
			phone,
			base: roleBase,
		})

		if (!match) {
			throw Error(`Could not find role based on ${roleBase}.`)
		}

		const roleId = match.id

		const addRoleResults = await client.emit('add-role::v2020_12_25', {
			target: {
				locationId,
				organizationId,
			},
			payload: {
				personId,
				roleId,
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(addRoleResults)
	}

	public async removeRoleFromPerson(options: {
		phone?: string
		roleBase: string
		organizationId: string
		locationId?: string
		personId: string
	}) {
		const {
			phone,
			organizationId: orgId,
			personId,
			roleBase,
			locationId,
		} = options
		const { client } = await this.personFixture.loginAsDemoPerson(phone)

		const role = await this.fetchFirstRoleWithBase({
			phone,
			base: roleBase,
			organizationId: orgId,
		})

		const results = await client.emit('remove-role::v2020_12_25', {
			target: {
				organizationId: orgId,
				locationId,
			},
			payload: {
				personId,
				roleId: role.id,
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(results)
	}

	public async fetchFirstRoleWithBase(options: {
		organizationId: string
		base: string
		phone?: string
	}) {
		const roles = await this.listRoles(options)
		const role = roles.find((role) => role.base === options.base)

		assert.isTruthy(role)

		return role
	}
}
