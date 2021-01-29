import { test, assert } from '@sprucelabs/test'
import AbstractConversationTest from '../../tests/AbstractConversationTest'
import suggesterUtil from '../../utilities/suggester.utility'

export default class SuggesterUtilTest extends AbstractConversationTest {
	@test()
	protected static async suggesterExists() {
		assert.isTruthy(suggesterUtil)
	}

	@test()
	protected static async returnsOnlyPossibility() {
		const results = await suggesterUtil.rank(
			[{ key: 'test', phrase: 'test' }],
			'test'
		)
		assert.isArray(results)
		assert.isEqualDeep(results, [
			{
				key: 'test',
				score: 1,
			},
		])
	}

	@test()
	protected static async returnsSortedByBestGuess() {
		const results = await suggesterUtil.rank(
			[
				{ key: 'wronge', phrase: 'wronge' },
				{ key: 'test', phrase: 'test' },
			],
			'test'
		)
		assert.isArray(results)
		assert.isEqualDeep(results[0], {
			key: 'test',
			score: 1,
		})
	}
}
