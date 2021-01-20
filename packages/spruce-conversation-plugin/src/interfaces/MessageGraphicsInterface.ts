import { FieldDefinitions, FieldDefinitionValueType } from '@sprucelabs/schema'
import { GraphicsInterface } from '@sprucelabs/spruce-skill-utils'
//@ts-ignore
import { SentimentAnalyzer } from 'node-nlp'
import { ScriptPlayerSendMessage } from './../types/conversation.types'

const sentiment = new SentimentAnalyzer({ language: 'en' })

type ScriptPlayerSendMessageHandler = (
	message: ScriptPlayerSendMessage
) => Promise<void>

export default class MessageGraphicsInterface implements GraphicsInterface {
	private sendMessageHandler: ScriptPlayerSendMessageHandler
	private resolve?: (value: string) => Promise<void> | void

	public constructor(options: {
		sendMessageHandler: ScriptPlayerSendMessageHandler
	}) {
		this.sendMessageHandler = options.sendMessageHandler
	}

	public renderSection(): void {
		this.notSupported('renderSection')
	}

	private notSupported(name: string) {
		throw new Error(`${name} is not supported on this interface.`)
	}

	public renderObject(): void {
		this.notSupported('renderObject')
	}

	public renderError(): void {
		this.notSupported('renderError')
	}

	public renderCodeSample(): void {
		this.notSupported('renderCodeSample')
	}

	public renderHero(): void {
		this.notSupported('renderHero')
	}

	public renderHeadline(): void {
		this.notSupported('renderHeadline')
	}

	public renderDivider(): void {
		this.notSupported('renderDivider')
	}

	public renderLine(message: string): void {
		void this.sendMessageHandler({ body: message })
	}
	public renderLines(): void {
		this.notSupported('renderLines')
	}
	public renderWarning(): void {
		this.notSupported('renderWarning')
	}
	public renderHint(): void {
		this.notSupported('renderHint')
	}
	public async renderImage(): Promise<void> {
		this.notSupported('renderImage')
	}

	public prompt<T extends FieldDefinitions>(
		definition: T
	): Promise<FieldDefinitionValueType<T, false>> {
		this.notSupported('prompt')
		console.log(definition)
		return null as any
	}

	public startLoading(): void {
		this.notSupported('startLoading')
	}

	public stopLoading(): void {
		this.notSupported('stopLoading')
	}

	public renderProgressBar(): void {
		this.notSupported('renderProgressBar')
	}

	public updateProgressBar(): void {
		this.notSupported('updateProgresSbar')
	}

	public removeProgressBar(): void {
		this.notSupported('removeProgressBar')
	}

	public async confirm(question: string): Promise<boolean> {
		this.renderLine(question)
		const results = await this.waitForNextMessage()
		const positiveWords = ['yes']
		const negativeWords = ['nah', 'no', 'nope']

		if (
			positiveWords.indexOf(
				results.toLocaleLowerCase().replace(/[^a-z]/gi, '')
			) > -1
		) {
			return true
		}

		if (
			negativeWords.indexOf(
				results.toLocaleLowerCase().replace(/[^a-z]/gi, '')
			) > -1
		) {
			return false
		}

		const analysis = await sentiment.getSentiment(results)

		return analysis.vote === 'neutral' || analysis.vote === 'positive'
	}

	private waitForNextMessage(): Promise<string> {
		return new Promise((resolve) => {
			this.resolve = resolve
		})
	}

	public async handleMessageBody(body: string) {
		await this.resolve?.(body)
		this.resolve = undefined
	}

	public isWaitingForInput() {
		return !!this.resolve
	}
}
