import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import SpruceError from '../errors/SpruceError'
import MessageGraphicsInterface from '../interfaces/MessageGraphicsInterface'
import {
	Script,
	ScriptPlayerOptions,
	SendMessageHandler,
	ScriptPlayerSendMessage,
	ScriptLine,
	DidMessageResponsePayload,
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

		this.graphicsInterface = new MessageGraphicsInterface({
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
		for (const line of this.script) {
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
			return normalizedLine({ ui: this.graphicsInterface })
		}

		return null
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
