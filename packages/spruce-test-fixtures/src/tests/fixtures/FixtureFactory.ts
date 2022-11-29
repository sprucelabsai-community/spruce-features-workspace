import { DatabaseFixture } from '@sprucelabs/data-stores'
import { SchemaError } from '@sprucelabs/schema'
import { ClientProxyDecorator } from '../..'
import SpruceError from '../../errors/SpruceError'
import {
	FixtureConstructorOptionsMap,
	FixtureMap,
	FixtureName,
} from '../../types/fixture.types'
import EventFixture from './EventFixture'
import LocationFixture from './LocationFixture'
import MercuryFixture from './MercuryFixture'
import OrganizationFixture from './OrganizationFixture'
import PermissionFixture from './PermissionFixture'
import PersonFixture from './PersonFixture'
import RoleFixture from './RoleFixture'
import SchemaFixture from './SchemaFixture'
import SeedFixture from './SeedFixture'
import SkillFixture from './SkillFixture'
import StoreFixture from './StoreFixture'
import ViewFixture from './ViewFixture'

export default class FixtureFactory {
	private static fixtures: any[] = []
	private cwd: string
	private namespace?: string
	private static viewMercury?: any

	public constructor(options: { cwd: string; namespace?: string }) {
		this.cwd = options.cwd
		if (!this.cwd) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				friendlyMessage: 'Mercury fixture needs cwd.',
				parameters: ['options.cwd'],
			})
		}

		this.namespace = options.namespace
	}

	public Fixture<Name extends FixtureName>(
		named: Name,
		options?: Partial<FixtureConstructorOptionsMap[Name]>
	): FixtureMap[Name] {
		const mercuryFixture = this.getMercuryFixture(named)
		let fixture: FixtureMap[Name] | undefined

		switch (named) {
			case 'mercury':
				fixture = mercuryFixture as FixtureMap[Name]
				break
			case 'person': {
				fixture = new PersonFixture({
					connectToApi: mercuryFixture.getConnectFactory(),
				}) as FixtureMap[Name]
				break
			}
			case 'role': {
				fixture = new RoleFixture({
					people: this.Fixture('person'),
					getNewestOrg: async () => {
						return this.Fixture('organization').getNewestOrganization()
					},
				}) as FixtureMap[Name]
				break
			}
			case 'organization': {
				const people =
					//@ts-ignore
					options?.people ??
					new PersonFixture({
						connectToApi: mercuryFixture.getConnectFactory(),
					})
				fixture = new OrganizationFixture({
					people,
					roles: this.Fixture('role'),
				}) as FixtureMap[Name]
				break
			}
			case 'skill': {
				//@ts-ignore
				const personFixture = options?.personFixture ?? this.Fixture('person')

				fixture = new SkillFixture({
					personFixture,
					connectToApi: mercuryFixture.getConnectFactory(),
				}) as FixtureMap[Name]
				break
			}
			case 'database': {
				fixture = new DatabaseFixture() as FixtureMap[Name]
				break
			}
			case 'store': {
				fixture = new StoreFixture() as FixtureMap[Name]
				break
			}
			case 'location': {
				fixture = new LocationFixture({
					roles: this.Fixture('role'),
					//@ts-ignore
					people: options?.people ?? this.Fixture('person'),
					//@ts-ignore
					organizations: options?.organizations ?? this.Fixture('organization'),
				}) as FixtureMap[Name]
				break
			}
			case 'seed':
				fixture = new SeedFixture({
					organizations: this.Fixture('organization'),
					locations: this.Fixture('location'),
					people: this.Fixture('person'),
				}) as FixtureMap[Name]
				break
			case 'view': {
				if (!this.namespace) {
					throw new Error(
						'You need to be in a registered skill to load view controllers.'
					)
				}
				fixture = new ViewFixture({
					//@ts-ignore
					people: options?.personFixture ?? this.Fixture('person'),
					connectToApi: mercuryFixture.getConnectFactory(),
					fixtureFactory: this,
					namespace: this.namespace,
					proxyDecorator: ClientProxyDecorator.getInstance(),
					cwd: this.cwd,
					...options,
				}) as any
				break
			}
		}

		if (fixture) {
			FixtureFactory.fixtures.unshift(fixture)
			return fixture
		}

		throw new SpruceError({
			code: 'INVALID_FIXTURE',
			suppliedName: named,
			validNames: [
				'skill',
				'mercury',
				'person',
				'organization',
				'store',
				'view',
				'seed',
				'location',
				'role',
			],
		})
	}

	private getMercuryFixture<Name extends FixtureName>(name: Name) {
		let mercury
		if (name === 'view') {
			if (!FixtureFactory.viewMercury) {
				FixtureFactory.viewMercury = new MercuryFixture(this.cwd)
				FixtureFactory.fixtures.push(FixtureFactory.viewMercury)
			}
			mercury = FixtureFactory.viewMercury
		}
		if (!mercury) {
			mercury = new MercuryFixture(this.cwd)
			FixtureFactory.fixtures.push(mercury)
		}

		return mercury
	}

	public static async destroy() {
		for (const f of this.fixtures) {
			if (f.destroy) {
				await f.destroy()
			}
		}

		this.fixtures = []
		FixtureFactory.viewMercury = undefined
	}

	public static async beforeAll() {
		await Promise.all([
			ViewFixture.beforeAll(),
			MercuryFixture.beforeAll(),
			StoreFixture.beforeAll(),
		])
	}

	public static async beforeEach(cwd: string) {
		await Promise.all([
			ViewFixture.beforeEach(),
			MercuryFixture.beforeEach(cwd),
			StoreFixture.beforeEach(),
			EventFixture.beforeEach(),
			SchemaFixture.beforeEach(),
			LocationFixture.beforeEach(),
			PermissionFixture.beforeEach(),
		])
	}

	public static async afterEach() {
		await this.destroy()
		await Promise.all([StoreFixture.afterEach()])
	}

	public static async afterAll() {
		await this.destroy()
	}
}
