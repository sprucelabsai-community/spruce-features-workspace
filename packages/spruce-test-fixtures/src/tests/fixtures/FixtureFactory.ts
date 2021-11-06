import { DatabaseFixture } from '@sprucelabs/data-stores'
import { SchemaError } from '@sprucelabs/schema'
import SpruceError from '../../errors/SpruceError'
import {
	FixtureConstructorOptionsMap,
	FixtureMap,
	FixtureName,
} from '../../types/fixture.types'
import EventFixture from './EventFixture'
import MercuryFixture from './MercuryFixture'
import OrganizationFixture from './OrganizationFixture'
import PersonFixture from './PersonFixture'
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
		const mercuryFixture = this.getMercuryFixture<Name>(named)
		let fixture: FixtureMap[Name] | undefined

		switch (named) {
			case 'mercury':
				fixture = mercuryFixture as FixtureMap[Name]
				break
			case 'person': {
				fixture = new PersonFixture(
					mercuryFixture.getApiClientFactory()
				) as FixtureMap[Name]
				break
			}
			case 'organization': {
				const personFixture = new PersonFixture(
					mercuryFixture.getApiClientFactory()
				)
				fixture = new OrganizationFixture(personFixture) as FixtureMap[Name]
				break
			}
			case 'skill': {
				const personFixture = new PersonFixture(
					mercuryFixture.getApiClientFactory()
				)

				fixture = new SkillFixture(
					personFixture,
					mercuryFixture.getApiClientFactory()
				) as any
				break
			}
			case 'database': {
				fixture = new DatabaseFixture() as any
				break
			}
			case 'store': {
				fixture = new StoreFixture() as any
				break
			}
			case 'view': {
				if (!this.namespace) {
					throw new Error(
						'You need to be in a registerid skill to load view controllers.'
					)
				}
				fixture = new ViewFixture({
					personFixture: this.Fixture('person'),
					connectToApi: mercuryFixture.getApiClientFactory(),
					namespace: this.namespace,
					...options,
				}) as any
				break
			}
		}

		if (fixture) {
			FixtureFactory.fixtures.push(fixture)

			return fixture
		}

		throw new SpruceError({
			code: 'INVALID_FIXTURE',
			suppliedName: named,
			validNames: ['skill', 'mercury', 'person', 'organization', 'store'],
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
			MercuryFixture.beforeAll(),
			DatabaseFixture.beforeAll(),
			StoreFixture.beforeAll(),
		])
	}

	public static async beforeEach() {
		await Promise.all([
			ViewFixture.beforeEach(),
			MercuryFixture.beforeEach(),
			StoreFixture.beforeEach(),
			EventFixture.beforeEach(),
		])
	}

	public static async afterEach() {
		await this.destroy()
		await Promise.all([StoreFixture.afterEach()])
	}
}
