import { skillViewSchema } from '@sprucelabs/heartwood-view-controllers'
import { validateSchemaValues } from '@sprucelabs/schema'
import { assert, test } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import FakeSkillViewController from '../../../tests/Fake.svc'
import ViewFixture from '../../../tests/fixtures/ViewFixture'

export default class FakingSkillViewControllersTest extends AbstractSpruceFixtureTest {
	protected static controllerMap = {
		fake: FakeSkillViewController,
	}
	private static viewFixture: ViewFixture

	protected static async beforeEach() {
		await super.beforeEach()
		this.viewFixture = this.Fixture('view', {
			controllerMap: {
				fake: FakeSkillViewController,
			},
		})
	}

	@test()
	protected static async canRenderkFakeSkillViewController() {
		const vc = this.viewFixture.Controller('fake' as any, {})
		const model = this.viewFixture.render(vc)

		validateSchemaValues(skillViewSchema, model)
	}

	@test('passed constructor options 1', { hello: 'world' })
	@test('passed constructor options 2', { taco: 'bell' })
	protected static async passesThroughConstructorAptions(options: any) {
		const vc = this.viewFixture.Controller('fake' as any, options)
		assert.doesInclude(vc.constructorOptions, options)
	}

	@test('passes args 1', { hello: 'world' })
	@test('passes args 2', { cheesey: 'burrito' })
	protected static async passesThroughLoadArgs(args: any) {
		const vc = this.viewFixture.Controller('fake' as any, {})

		await this.viewFixture.load(vc, args)

		assert.isEqualDeep(vc.args, args)
	}
}
