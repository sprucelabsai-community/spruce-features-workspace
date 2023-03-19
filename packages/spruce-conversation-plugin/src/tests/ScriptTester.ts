import { SchemaError } from '@sprucelabs/schema'
import inquirer from 'inquirer'
import SpruceError from '../errors/SpruceError'
import TestGraphicsInterface, {
	PromptHandler,
} from '../interfaces/TestGraphicsInterface'
import { TopicScriptPlayer } from '../topics/TopicScriptPlayer'
import { TopicSuggester } from '../topics/TopicSuggester'
import { LoadedTopicDefinition, Message } from '../types/conversation.types'
import randomUtil from '../utilities/random.utility'

export default class ScriptTester {
	private writeHandler: WriteHandler
	private player?: TopicScriptPlayer
	private topics: SimplifiedTopic[]
	private selectPromptHandler: SelectHandler
	private promptHandler: PromptHandler
	private lineDelay?: number
	private shouldPlayReplayAfterFinish: boolean
	private suggester?: TopicSuggester

	private constructor(
		topics: SimplifiedTopic[],
		writeHandler?: WriteHandler,
		selectPromptHandler?: SelectHandler,
		promptHandler?: PromptHandler,
		lineDelay?: number,
		shouldPlayReplayAfterFinish?: boolean
	) {
		this.writeHandler = writeHandler ?? ((message) => console.log(message.body))
		this.topics = topics
		this.selectPromptHandler =
			selectPromptHandler ?? inquirerSelectPromptHandler
		this.promptHandler = promptHandler ?? inquirerPromptHandler
		this.lineDelay = lineDelay
		this.shouldPlayReplayAfterFinish = shouldPlayReplayAfterFinish ?? true
	}

	public async go(firstMessage?: string) {
		let match

		if (this.topics.length > 1) {
			match = await this.promptForDesiredTopic()
		} else {
			match = this.topics[0]
		}

		this.player = new TopicScriptPlayer({
			script: match.script,
			lineDelay: this.lineDelay,
			target: { personId: '1234' },
			graphicsInterface: new TestGraphicsInterface({
				sendMessageHandler: async (message) => {
					return this.writeHandler(message)
				},
				promptHandler: this.promptHandler,
			}),
			sendMessageHandler: async (message) => {
				return this.writeHandler(message)
			},
			getContext: () => ({}),
		})

		let msg = firstMessage

		if (!msg) {
			msg = await this.promptHandler({
				body: 'Send your first message to kick-off the conversation:',
			})
		}

		await this.reportOnConfidence(msg)

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const response = await this.handleInput(msg)

			if (response?.transitionConversationTo) {
				if (response.topicChangers) {
					this.writeHandler({ body: randomUtil.rand(response.topicChangers) })
				} else if (response.repairs) {
					this.writeHandler({ body: randomUtil.rand(response.repairs) })
				}
				this.writeHandler({
					body: generateTransitionMessage(response.transitionConversationTo),
				})
			}

			this.writeHandler({ body: END_OF_LINE })

			if (!this.shouldPlayReplayAfterFinish) {
				return
			}

			await this.promptHandler({ body: 'Enter to start again.' })
		}
	}

	private async reportOnConfidence(msg: string) {
		if (!this.suggester) {
			this.suggester = await TopicSuggester.Suggester({ topics: this.topics })
		}

		const suggestions = await this.suggester.suggest(msg)

		if (suggestions.length > 0) {
			this.writeHandler({ body: '\n\nMy confidence for each topic:' })
			for (const suggestion of suggestions) {
				this.writeHandler({
					body: `\t${suggestion.key}: ${Math.round(
						suggestion.confidence * 100
					)}%`,
				})
			}

			this.writeHandler({ body: '\n\n' })
		}
	}

	private async promptForDesiredTopic() {
		const key = await this.selectPromptHandler({
			body: `Which topic would you like to discuss?`,
			choices: this.topics.map((s) => ({
				value: s.key,
				label: s.label,
			})),
		})

		const match = this.topics.find((s) => s.key === key)

		if (!match) {
			throw new SpruceError({
				code: 'TOPIC_NOT_FOUND',
				suppliedTopic: key,
				validTopics: this.topics.map((s) => s.key),
			})
		}

		return match
	}

	public async handleInput(input: string) {
		if (!this.player) {
			throw new SpruceError({ code: 'TESTER_NOT_STARTED' })
		}
		//@ts-ignore
		return this.player?.handleMessage({ body: input })
	}

	public static async Tester(options: {
		topics: SimplifiedTopic[]
		writeHandler?: WriteHandler
		selectPromptHandler?: SelectHandler
		promptHandler?: PromptHandler
		lineDelay?: number
		shouldPlayReplayAfterFinish?: boolean
	}) {
		const missing: string[] = []

		if (!options?.topics) {
			missing.push('script')
		}

		if (missing.length > 0) {
			throw new SchemaError({ code: 'MISSING_PARAMETERS', parameters: missing })
		}

		return new ScriptTester(
			options.topics,
			options.writeHandler,
			options.selectPromptHandler,
			options.promptHandler,
			options.lineDelay,
			options.shouldPlayReplayAfterFinish
		)
	}
}

export function generateTransitionMessage(
	transitionConversationTo: string
): string {
	return `Conversation exited. Transitioning to ${transitionConversationTo}.`
}

type WriteHandler = (message: Pick<Message, 'body' | 'choices'>) => void
type SelectHandler = (
	message: Pick<Message, 'body' | 'choices'>
) => Promise<string>
type SimplifiedTopic = LoadedTopicDefinition

const inquirerSelectPromptHandler: SelectHandler = async (message) => {
	const answer = await inquirer.prompt({
		type: 'list',
		name: 'select',
		message: message.body,
		choices: message.choices?.map((c) => ({ name: c.label, value: c.value })),
	})

	return answer.select as string
}

const inquirerPromptHandler: SelectHandler = async (message) => {
	const answer = await inquirer.prompt({
		type: 'input',
		name: 'input',
		message: message.body,
	})

	return answer.input as string
}

export const END_OF_LINE = 'END OF LINE 👾'
