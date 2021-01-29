import { TopicSuggester } from '../conversations/TopicSuggester'

type Suggestion = {
	key: string
	score: number
}

const suggesterUtil = {
	async rank(
		possibilities: { key: string; phrase: string }[],
		utterance: string
	): Promise<Suggestion[]> {
		const topicSuggester = await TopicSuggester.Suggester({
			topics: possibilities.map((p) => ({
				key: p.key,
				label: p.key,
				utterances: [p.phrase],
			})),
		})

		const results = await topicSuggester.suggest(utterance)

		const suggestions: Suggestion[] = results.map((r) => ({
			key: r.key,
			score: r.confidence,
		}))

		return suggestions
	},
}

export default suggesterUtil
