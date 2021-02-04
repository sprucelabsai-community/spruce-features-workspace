import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import random from 'random'
import SpruceError from '../errors/SpruceError'
import MessageGraphicsInterface from '../interfaces/MessageGraphicsInterface'
import {
	Script,
	ScriptPlayerOptions,
	SendMessageHandler,
	ScriptPlayerSendMessage,
	ScriptLine,
	DidMessageResponsePayload,
	ScriptLineCallbackOptions,
} from '../types/conversation.types'

type MessageTarget = SpruceSchemas.Spruce.v2020_07_22.MessageTarget
type Message = SpruceSchemas.Spruce.v2020_07_22.Message

function getRandomInt(min: number, max: number) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export class TopicScriptPlayer {
	private script: Script
	private sendMessageHandler: SendMessageHandler
	private target: MessageTarget
	private graphicsInterface: MessageGraphicsInterface
	private lineDelay: number

	public constructor(options: ScriptPlayerOptions) {
		const missing: string[] = []
		if (!options?.script) {
			missing.push('script')
		}

		if (!options?.sendMessageHandler) {
			missing.push('sendMessageHandler')
		}

		if (!options?.target.personId) {
			missing.push('target.personId')
		}

		if (missing.length > 0) {
			throw new SpruceError({
				code: 'MISSING_PARAMETERS',
				parameters: missing,
			})
		}

		this.script = options.script
		this.target = options.target
		this.sendMessageHandler = options.sendMessageHandler
		this.lineDelay = options.lineDelay ?? 1000

		this.graphicsInterface =
			options.graphicsInterface ??
			new MessageGraphicsInterface({
				sendMessageHandler: this.sendMessage.bind(this),
			})
	}

	public async handleMessage(
		message: Message
	): Promise<DidMessageResponsePayload | null> {
		if (this.graphicsInterface.isWaitingForInput()) {
			await this.graphicsInterface.handleMessageBody(message.body)
		} else {
			return this.play(message)
		}
		return null
	}

	private async play(message: Message) {
		let isFirstLine = true

		for (const line of this.script) {
			if (!isFirstLine) {
				await new Promise((resolve) => setTimeout(resolve, this.lineDelay))
			}

			isFirstLine = false

			const results = await this.handleLine(message, line)

			if (results) {
				return results
			}
		}

		return null
	}

	private async handleLine(message: Message, line: ScriptLine) {
		let normalizedLine = line

		if (Array.isArray(line)) {
			normalizedLine = this.pickRandomLine(line)
		}

		if (typeof normalizedLine === 'string') {
			await this.sendMessage({
				body: normalizedLine,
			})
		} else if (typeof normalizedLine === 'function') {
			return normalizedLine(this.buildCallbackOptions())
		}

		return null
	}

	private buildCallbackOptions(): ScriptLineCallbackOptions {
		return {
			ui: this.graphicsInterface,
			rand: (possibilities) => {
				return possibilities[random.int(0, possibilities.length - 1)]
			},
		}
	}

	protected pickRandomLine(line: any[]): ScriptLine {
		const idx = getRandomInt(0, line.length - 1)
		return line[idx] as ScriptLine
	}

	private async sendMessage(message: ScriptPlayerSendMessage) {
		await this.sendMessageHandler({
			...message,
			target: this.target,
			classification: 'transactional',
		})
	}
}
