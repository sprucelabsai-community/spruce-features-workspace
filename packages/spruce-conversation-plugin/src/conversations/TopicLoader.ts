import pathUtil from 'path'
import globby from 'globby'
import SpruceError from '../errors/SpruceError'
import { TopicDefinition } from '../types/conversation.types'

type LoadedTopicDefinition = TopicDefinition & {
	key: string
}

export default class TopicLoader {
	private constructor() {}

	public static async loadTopics(sourceDir: string) {
		const pattern = pathUtil.join(
			sourceDir,
			'conversations',
			'**/*.topic.[j|t]s'
		)

		const matches = await globby(pattern)
		const topics: LoadedTopicDefinition[] = []

		if (matches.length > 0) {
			for (const match of matches) {
				const topic = this.loadTopic(match)
				topics.push(topic)
			}
		}

		return topics
	}

	private static loadTopic(match: string): LoadedTopicDefinition {
		const imported = require(match) as { default?: LoadedTopicDefinition }
		const file = pathUtil.basename(match).replace(pathUtil.extname(match), '')
		const key = file.split('.')[0]

		if (!imported || !imported.default) {
			throw new SpruceError({
				code: 'INVALID_TOPIC',
				topicScript: file,
				friendlyMessage: 'Default export missing.',
			})
		}

		const { default: topicDefinition } = imported

		topicDefinition.key = key

		const missing: string[] = []

		const keys = ['label', 'utterances', 'script']

		for (const key of keys) {
			//@ts-ignore
			if (!topicDefinition[key]) {
				missing.push(key)
			}
		}

		if (missing.length > 0) {
			throw new SpruceError({
				code: 'INVALID_TOPIC',
				topicScript: file,
				originalError: new SpruceError({
					code: 'MISSING_PARAMETERS',
					parameters: missing,
				}),
			})
		}

		return topicDefinition
	}
}
