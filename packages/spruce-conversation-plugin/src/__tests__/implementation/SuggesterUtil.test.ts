import { test, assert } from '@sprucelabs/test-utils'
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

	@test(
		'doesMatch is false when way off',
		['one', 'two', 'three', 'four'],
		'miss',
		false
	)
	@test(
		'doesMatch is true when perfect match',
		['one', 'two', 'three', 'four'],
		'one',
		true
	)
	@test(
		'doesMatch is true with ha',
		['ha', 'haha', 'lol', 'lolz', 'rofl', 'hahahah', 'haha'],
		'haha!!!',
		true
	)
	@test(
		'doesMatch is true with ha',
		['ha', 'haha', 'lol', 'lolz', 'rofl', 'hahahah'],
		'lol',
		true
	)
	@test(
		'doesMatch is false with lame',
		['ha', 'haha', 'lol', 'lolz', 'rofl', 'hahahah'],
		'lame',
		false
	)
	@test(
		'doesMatch is false with horrible',
		['ha', 'haha', 'lol', 'lolz', 'rofl', 'hahahah'],
		'horrible',
		false
	)
	@test(
		'doesMatch is false with hey',
		['ha', 'haha', 'lol', 'lolz', 'rofl', 'hahahah'],
		'hey',
		false
	)
	protected static async matchesByReturningTopOptionsAboveThreshold(
		phrases: string[],
		utterance: string,
		expected: boolean
	) {
		const results = await suggesterUtil.doesMatch(phrases, utterance)
		assert.isEqual(results, expected)
	}
}
