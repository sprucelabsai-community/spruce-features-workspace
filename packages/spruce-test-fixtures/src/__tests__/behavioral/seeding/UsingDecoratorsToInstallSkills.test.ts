import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { assert, test } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_SKILL_DECORATORS } from '../../../tests/constants'
import install from '../../../tests/decorators/install'
import login from '../../../tests/decorators/login'
import seed from '../../../tests/decorators/seed'
import MercuryFixture from '../../../tests/fixtures/MercuryFixture'

MercuryFixture.setShouldRequireLocalListeners(false)

@login(DEMO_NUMBER_SKILL_DECORATORS)
export default class UsingDecoratorsToInstallSkills extends AbstractSpruceFixtureTest {
	private static skill: SpruceSchemas.Spruce.v2020_07_22.Skill

	protected static async beforeEach() {
		await super.beforeEach()
		this.skill = await this.skills.seedDemoSkill()
	}

	@test()
	protected static throwsWhenMissingNamespaces() {
		assert.doesThrow(() => install.skills())
	}

	@test()
	protected static returnsDecorator() {
		const decorator = this.getDecorator()
		assert.isFunction(decorator)
	}

	@test()
	@seed('organizations', 1)
	protected static async callsOriginalTestMethod() {
		let wasHit = false
		await this.executeDecorator({
			testFunction: async () => {
				wasHit = true
			},
		})

		assert.isTrue(wasHit)
	}

	@test('passes args 1', [1])
	@test('passes args 1', ['hello', 'world'])
	@seed('organizations', 1)
	protected static async passesThroughOriginalArgs(args: any) {
		let passedArgs: any

		await this.executeDecorator({
			testFunction: async (...args: any[]) => {
				passedArgs = args
			},
			args,
		})

		assert.isEqualDeep(passedArgs, args)
	}

	@test()
	protected static async throwsWithoutSeedingOrg() {
		await assert.doesThrowAsync(() =>
			this.executeDecorator({ testFunction: async () => {} })
		)
	}

	@test()
	@seed('organizations', 1)
	protected static async throwsWhenInstallingBadSkill() {
		await assert.doesThrowAsync(() =>
			this.executeDecorator({
				testFunction: async () => {},
				namespaces: ['not-found'],
			})
		)
	}

	@test()
	@seed('organizations', 1)
	protected static async doesNotEmitDidInstall() {
		let passedPayload: any

		await login.getClient().on('install-skill::v2020_12_25', ({ payload }) => {
			passedPayload = payload
			return {}
		})

		await this.executeDecorator({
			testFunction: async () => {},
		})

		assert.isFalse(passedPayload.shouldNotifySkillOfInstall)
	}

	private static async executeDecorator(options: {
		testFunction: () => Promise<any>
		args?: any[]
		namespaces?: string[]
	}) {
		const { testFunction, args, namespaces } = options

		const mockDescriptor = {
			value: testFunction,
		}

		const decorator = this.getDecorator(namespaces)
		decorator(this, 'myTest', mockDescriptor)

		//@ts-ignore
		await mockDescriptor.value(...(args ? args : []))
	}

	private static getDecorator(namespaces?: string[]) {
		const slugs = namespaces ?? [this.skill.slug]
		return install.skills(...slugs)
	}
}
