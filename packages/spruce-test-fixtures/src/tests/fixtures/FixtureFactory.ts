import { DatabaseFixture } from '@sprucelabs/data-stores'
import SpruceError from '../../errors/SpruceError'
import { FixtureMap, FixtureName } from '../../types/fixture.types'
import MercuryFixture from './MercuryFixture'
import OrganizationFixture from './OrganizationFixture'
import PersonFixture from './PersonFixture'
import SkillFixture from './SkillFixture'
import StoreFixture from './StoreFixture'
import ViewControllerFixture from './ViewControllerFixture'

export default class FixtureFactory {
	private static fixtures: any[] = []
	private cwd: string

	public constructor(options: { cwd: string }) {
		this.cwd = options.cwd
		if (!this.cwd) {
			throw new SpruceError({
				code: 'MISSING_PARAMETERS',
				friendlyMessage: 'Mercury fixture needs cwd.',
				parameters: ['options.cwd'],
			})
		}
	}

	public Fixture<Name extends FixtureName>(named: Name): FixtureMap[Name] {
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
				fixture = new ViewControllerFixture(mercuryFixture) as any
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
		await MercuryFixture.beforeAll()
		await DatabaseFixture.beforeAll()
		await StoreFixture.beforeAll()
	}

	public static async beforeEach() {
		await ViewControllerFixture.beforeEach()
		await MercuryFixture.beforeEach()
		await StoreFixture.beforeEach()
	}
}
