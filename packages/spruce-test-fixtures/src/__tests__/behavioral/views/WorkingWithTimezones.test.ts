import { test, assert } from '@sprucelabs/test'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import ViewFixture from '../../../tests/fixtures/ViewFixture'
import SpyLocale from '../../../tests/SpyLocale'

export default class WorkingWithTimezonesTest extends AbstractSpruceFixtureTest {
	public static controllerMap = {}

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		this.views = this.Fixture('view', { controllerMap: this.controllerMap })
	}

	@test()
	protected static canGetInstance() {
		const instance = this.getInstance()
		assert.isTrue(instance instanceof SpyLocale)
	}

	@test()
	protected static instanceShared() {
		assert.isEqual(this.getInstance(), this.getInstance())
	}

	@test()
	protected static returnsInstanceFromRouter() {
		assert.isEqualDeep(
			this.views.getRouter().buildLoadOptions().locale,
			this.getInstance()
		)
	}

	@test()
	protected static instanceResetByViewFixture() {
		const instance = this.getInstance()
		ViewFixture.beforeEach()
		assert.isNotEqual(this.getInstance(), instance)
	}

	@test()
	protected static throwsWhenMissing() {
		const err = assert.doesThrow(() =>
			//@ts-ignore
			this.getInstance().setTimezoneOffsetMinutes()
		)
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['offsetMinutes'],
		})
	}

	@test('can set offset 1', 10)
	@test('can set offset 2', 20)
	protected static canSetTimezoneOffset(offsetMinutes: number) {
		this.getInstance().setTimezoneOffsetMinutes(offsetMinutes)
		this.assertCurrentOffset(offsetMinutes)
	}

	@test()
	protected static defaultsToNoOffset() {
		this.assertCurrentOffset(0)
	}

	private static assertCurrentOffset(offsetMinutes: number) {
		assert.isEqual(this.getInstance().getTimezoneOffsetMinutes(), offsetMinutes)
	}

	private static getInstance() {
		return SpyLocale.getInstance()
	}
}
