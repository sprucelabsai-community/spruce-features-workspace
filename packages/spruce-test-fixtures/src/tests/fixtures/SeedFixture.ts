import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { assertOptions, SchemaError } from '@sprucelabs/schema'
import { roleSchema } from '@sprucelabs/spruce-core-schemas'
import { namesUtil } from '@sprucelabs/spruce-skill-utils'
import { assert } from '@sprucelabs/test-utils'
import { RoleBase } from '../../types/fixture.types'
import phoneNumberIncrementor from '../../utilities/phoneNumberIncrementor'
import LocationFixture from './LocationFixture'
import OrganizationFixture from './OrganizationFixture'
import PersonFixture from './PersonFixture'

type Organization = SpruceSchemas.Spruce.v2020_07_22.Organization
type Location = SpruceSchemas.Spruce.v2020_07_22.Location
type Person = SpruceSchemas.Spruce.v2020_07_22.Person

export interface SeedLocationOptions {
	totalLocations: number
	organizationId?: string
	phone?: string
	totalGuests?: number
	totalTeammates?: number
	totalManagers?: number
	totalOwners?: number
	totalGroupManagers?: number
	startingPhone?: string
}

export default class SeedFixture {
	private organizations: OrganizationFixture
	private locations: LocationFixture
	private people: PersonFixture
	private static lastPhone: string

	public constructor(options: {
		organizations: OrganizationFixture
		locations: LocationFixture
		people: PersonFixture
	}) {
		this.organizations = options.organizations
		this.locations = options.locations
		this.people = options.people
	}

	public async seedOrganizations(options?: {
		totalOrganizations?: number
		phone?: string
	}) {
		const { totalOrganizations, phone } = options ?? {}

		const orgs: Organization[] = await Promise.all(
			new Array(totalOrganizations ?? 3)
				.fill(0)
				.map(() => this.organizations.seedDemoOrganization({ phone }))
		)

		return orgs
	}

	public async seedGuests(options?: { totalGuests?: number }) {
		await this.seedPeople({
			...options,
			startingPhone: SeedFixture.lastPhone ?? '555-999-0000',
		})

		return []
	}

	public async seedTeammates(options?: { totalTeammates?: number }) {
		await this.seedPeople({
			...options,
			startingPhone: SeedFixture.lastPhone ?? '555-999-1000',
		})

		return []
	}

	public async seedGroupManagers(options?: { totalGroupManagers?: number }) {
		await this.seedPeople({
			...options,
			startingPhone: SeedFixture.lastPhone ?? '555-999-2000',
		})

		return []
	}

	public async seedManagers(options?: { totalManagers?: number }) {
		await this.seedPeople({
			...options,
			startingPhone: SeedFixture.lastPhone ?? '555-999-3000',
		})

		return []
	}

	public async seedOwners(options?: { totalOwners?: number }) {
		await this.seedPeople({
			...options,
			startingPhone: SeedFixture.lastPhone ?? '555-999-4000',
		})

		return []
	}

	public async seedAccount(options: SeedLocationOptions) {
		let { totalLocations, organizationId, phone } = assertOptions(
			options,
			['totalLocations'],
			`You forgot to pass 'totalLocations', if you are using @seed('locations', 1), make sure you pass the total locations as the second param.`
		)

		const location = await this.locations.seedDemoLocation({
			organizationId,
			phone,
		})

		organizationId = location.organizationId

		const locations: Location[] = await Promise.all(
			new Array(totalLocations - 1).fill(0).map(() =>
				this.locations.seedDemoLocation({
					organizationId,
				})
			)
		)

		const results: {
			guests: Person[]
			teammates: Person[]
			managers: Person[]
			groupManagers: Person[]
			owners: Person[]
		} = await this.seedPeople({
			...options,
			locationId: location.id,
			organizationId,
		})

		return { locations: [location, ...locations], ...results }
	}

	public async seedPeople(
		options: Omit<SeedLocationOptions, 'totalLocations'> & {
			locationId?: string
			organizationId?: string
		}
	) {
		let {
			totalGroupManagers,
			totalGuests,
			totalManagers,
			totalOwners,
			totalTeammates,
			startingPhone,
			locationId,
			organizationId,
		} = options

		if (!organizationId) {
			const org = await this.organizations.getNewestOrganization()
			assert.isTruthy(
				org,
				`You gotta @seed('organizations',1) before seeding people.`
			)

			organizationId = org.id
		}

		if (!locationId) {
			const location = await this.locations.getNewestLocation()
			locationId = location?.id
		}

		const results: {
			guests: Person[]
			teammates: Person[]
			managers: Person[]
			groupManagers: Person[]
			owners: Person[]
		} = {
			guests: [],
			teammates: [],
			managers: [],
			groupManagers: [],
			owners: [],
		}

		let totalToGenerate =
			(totalGroupManagers ?? 0) +
			(totalGuests ?? 0) +
			(totalManagers ?? 0) +
			(totalOwners ?? 0) +
			(totalTeammates ?? 0)

		if (totalToGenerate > 0) {
			totalToGenerate++

			if (!startingPhone) {
				throw new SchemaError({
					code: 'MISSING_PARAMETERS',
					parameters: ['startingPhone'],
				})
			}

			const bases = roleSchema.fields.base.options.choices.map((c) => c.value)
			const numbers = phoneNumberIncrementor.generate({
				totalToGenerate,
				startingPhone,
			})

			for (const base of bases) {
				const key = `total${namesUtil.toPascal(base)}s`
				//@ts-ignore
				const total = options[key] ?? 0

				if (total > 0) {
					const people = await this.seedPeopleWithRole({
						total,
						numbers,
						locationId,
						organizationId,
						roleBase: base,
					})

					//@ts-ignore
					results[base + 's'] = people
				}
			}

			SeedFixture.lastPhone = numbers[0]
		}

		return results
	}

	private async seedPeopleWithRole(options: {
		total: number
		numbers: string[]
		locationId?: string
		organizationId: string
		roleBase: RoleBase
	}) {
		const {
			total,
			numbers,
			locationId,
			organizationId,
			roleBase: base,
		} = options

		if (total === 0) {
			return []
		}

		const people = await Promise.all(
			new Array(total).fill(0).map(async () => {
				const number = numbers.shift()
				let { person, client } = await this.people.loginAsDemoPerson(number)

				const updated = person.firstName
					? {}
					: await this.people.generateRandomName(client)

				person = {
					...person,
					...updated,
				}

				if (locationId) {
					await this.locations.addPerson({
						locationId,
						organizationId,
						personId: person.id,
						roleBase: base,
					})
				} else {
					await this.organizations.addPerson({
						organizationId,
						personId: person.id,
						roleBase: base,
					})
				}

				return person
			})
		)
		return people
	}

	public async resetAccount(phone?: string) {
		await this.organizations.deleteAllOrganizations(phone)
	}
}
