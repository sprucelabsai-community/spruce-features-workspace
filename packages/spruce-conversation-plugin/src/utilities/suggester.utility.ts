import FuzzySet from 'fuzzyset'
import { TopicSuggester } from '../topics/TopicSuggester'

interface Suggestion {
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

    async doesMatch(phrases: string[], utterance: string) {
        //@ts-ignore
        const f = new FuzzySet(phrases)
        const matches = f.get(utterance)

        return (
            (matches && matches.filter((m: any) => m[0] > 0.4).length > 0) ??
            false
        )
    },
}

export default suggesterUtil
