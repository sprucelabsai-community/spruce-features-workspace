import { DatabaseFixture } from '@sprucelabs/data-stores'
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
import ViewControllerFixture from './ViewControllerFixture'

export default class FixtureFactory {
	private static fixtures: any[] = []
	private cwd: string
	private namespace?: string

	public constructor(options: { cwd: string; namespace?: string }) {
		this.cwd = options.cwd
		if (!this.cwd) {
			throw new SpruceError({
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
		const mercuryFixture = new MercuryFixture(this.cwd)
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
			case 'vc': {
				if (!this.namespace) {
					throw new Error(
						'You need to be in a registerid skill to load view controllers.'
					)
				}
				fixture = new ViewControllerFixture({
					mercuryFixture,
					namespace: this.namespace,
					...options,
				}) as any
				break
			}
		}

		if (fixture) {
			FixtureFactory.fixtures.push(fixture)
			FixtureFactory.fixtures.push(mercuryFixture)
			return fixture
		}

		throw new SpruceError({
			code: 'INVALID_FIXTURE',
			suppliedName: named,
			validNames: ['skill', 'mercury', 'person', 'organization', 'store'],
		})
	}

	public static async destroy() {
		for (const f of this.fixtures) {
			if (f.destroy) {
				await f.destroy()
			}
		}

		this.fixtures = []
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
			ViewControllerFixture.beforeEach(),
			MercuryFixture.beforeEach(),
			StoreFixture.beforeEach(),
			EventFixture.beforeEach(),
		])
	}
}
