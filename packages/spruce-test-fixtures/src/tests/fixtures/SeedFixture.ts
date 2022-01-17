import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { SchemaError } from '@sprucelabs/schema'
import { roleSchema } from '@sprucelabs/spruce-core-schemas'
import { namesUtil } from '@sprucelabs/spruce-skill-utils'
import phoneNumberIncrementor from '../../utilities/phoneNumberIncrementor'
import LocationFixture from './LocationFixture'
import OrganizationFixture from './OrganizationFixture'
import PersonFixture from './PersonFixture'

type Organization = SpruceSchemas.Spruce.v2020_07_22.Organization
type Location = SpruceSchemas.Spruce.v2020_07_22.Location

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

	public async seedAccount(options: SeedLocationOptions) {
		let { totalLocations, organizationId, phone, startingPhone } = options

		const first = await this.locations.seedDemoLocation({
			organizationId,
			phone,
		})

		organizationId = first.organizationId

		const locations: Location[] = await Promise.all(
			new Array(totalLocations - 1).fill(0).map(() =>
				this.locations.seedDemoLocation({
					organizationId,
				})
			)
		)

		const results: {
			guests: SpruceSchemas.Spruce.v2020_07_22.Person[]
			teammates: SpruceSchemas.Spruce.v2020_07_22.Person[]
			managers: SpruceSchemas.Spruce.v2020_07_22.Person[]
			groupManagers: SpruceSchemas.Spruce.v2020_07_22.Person[]
			owners: SpruceSchemas.Spruce.v2020_07_22.Person[]
		} = {
			guests: [],
			teammates: [],
			managers: [],
			groupManagers: [],
			owners: [],
		}

		const totalToGenerate =
			(options.totalGroupManagers ?? 0) +
			(options.totalGuests ?? 0) +
			(options.totalManagers ?? 0) +
			(options.totalOwners ?? 0) +
			(options.totalTeammates ?? 0)

		if (totalToGenerate > 0) {
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
					const people = await this.seedPeople(total, numbers, first, base)

					//@ts-ignore
					results[base + 's'] = people
				}
			}
		}

		return { locations: [first, ...locations], ...results }
	}

	private async seedPeople(
		total: number,
		numbers: string[],
		location: Pick<
			SpruceSchemas.Spruce.v2020_07_22.Location,
			'id' | 'organizationId'
		>,
		base: string
	) {
		if (total === 0) {
			return []
		}

		const people = await Promise.all(
			new Array(total).fill(0).map(async () => {
				const number = numbers.shift()
				let { person, client } = await this.people.loginAsDemoPerson(number)

				const updated = await this.people.generateRandomName(client)

				person = {
					...person,
					...updated,
				}

				await this.locations.addPerson({
					locationId: location.id,
					organizationId: location.organizationId,
					personId: person.id,
					roleBase: base,
				})

				return person
			})
		)
		return people
	}

	public async resetAccount(phone?: string) {
		await this.organizations.deleteAllOrganizations(phone)
	}
}
