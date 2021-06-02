import { test, assert } from '@sprucelabs/test'
import plugin from '../../plugins/view.plugin'
import AbstractViewTest from '../../tests/AbstractViewTest'

export default class CheckingHealthTest extends AbstractViewTest {
	@test()
	protected static async pluginReturnsInstance() {
		assert.isTruthy(plugin instanceof Function)
	}
}
