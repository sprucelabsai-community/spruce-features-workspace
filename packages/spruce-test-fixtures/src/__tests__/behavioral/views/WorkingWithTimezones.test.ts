import { LocaleImpl } from '@sprucelabs/calendar-utils'
import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'

export default class WorkingWithTimezonesTest extends AbstractSpruceFixtureTest {
	public static controllerMap = {}

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		this.views = this.Fixture('view', { controllerMap: this.controllerMap })
	}

	@test()
	protected static canGetInstance() {
		const instance = this.getInstance()
		assert.isTrue(instance instanceof LocaleImpl)
	}

	@test()
	protected static instanceShared() {
		assert.isEqual(this.getInstance(), this.getInstance())
	}

	@test()
	protected static returnsInstanceFromRouter() {
		assert.isEqual(
			this.views.getRouter().buildLoadOptions().locale,
			this.getInstance()
		)
	}

	@test('can set offset 1', 10)
	@test('can set offset 2', 20)
	protected static canSetTimezoneOffset(offsetMinutes: number) {
		this.getInstance().setTimezoneOffsetMinutes(offsetMinutes)
		this.assertCurrentOffset(offsetMinutes)
	}

	private static assertCurrentOffset(offsetMinutes: number) {
		assert.isEqual(this.getInstance().getTimezoneOffsetMinutes(), offsetMinutes)
	}

	private static getInstance() {
		return this.views.getLocale()
	}
}
