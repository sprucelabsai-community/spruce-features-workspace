import {
    areSchemaValuesValid,
    FieldDefinitions,
    FieldDefinitionValueType,
} from '@sprucelabs/schema'
import { GraphicsInterface } from '@sprucelabs/spruce-skill-utils'
//@ts-ignore
import { SentimentAnalyzer } from 'node-nlp'
import {
    FieldHandler,
    ScriptPlayerSendMessageHandler,
} from '../types/conversation.types'
import EmailFieldHandler from './fieldHandlers/EmailFieldHandler'
import SelectFieldHandler from './fieldHandlers/SelectFieldHandler'
import TextFieldHandler from './fieldHandlers/TextFieldHandler'

const sentiment = new SentimentAnalyzer({ language: 'en' })

export interface MessageGraphicsInterfaceOptions {
    sendMessageHandler: ScriptPlayerSendMessageHandler
    invalidValueRepairs?: string[]
}

export default class MessageGraphicsInterface implements GraphicsInterface {
    private sendMessageHandler: ScriptPlayerSendMessageHandler
    private resolve?: (value: string) => void
    private invalidValueRepairs: string[]
    private invalidValueRepairIdx = 0
    private isDestroyed = false

    public constructor(options: MessageGraphicsInterfaceOptions) {
        this.sendMessageHandler = options.sendMessageHandler
        this.invalidValueRepairs = options.invalidValueRepairs ?? [
            "Oh geezy, I'm sorry, a don't understand.",
        ]
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

    public async prompt<T extends FieldDefinitions>(
        definition: T
    ): Promise<FieldDefinitionValueType<T, false>> {
        let value: any

        const handlersByType: Record<string, FieldHandler<any>> = {
            select: SelectFieldHandler.handle,
            text: TextFieldHandler.handle,
            email: EmailFieldHandler.handle,
        }

        const handler = handlersByType[definition.type]

        if (!handler) {
            this.notSupported(`prompt.${definition.type}`)
        }

        do {
            if (this.isDestroyed) {
                return null as any
            }

            value = await handler({
                sendMessageHandler: this.sendMessageHandler,
                waitForNextMessageHandler: this.waitForNextMessage.bind(this),
                definition,
            })

            const isValid = areSchemaValuesValid(
                {
                    id: 'promptvalidateschema',
                    fields: {
                        prompt: definition,
                    },
                },
                { prompt: value }
            )

            if (!isValid) {
                this.renderLine(this.getNextInvalidValueRepair())
                value = undefined
            }
        } while (!value)

        return value
    }

    private getNextInvalidValueRepair(): string {
        const repair = this.invalidValueRepairs[this.invalidValueRepairIdx]
        this.invalidValueRepairIdx++
        if (this.invalidValueRepairIdx > this.invalidValueRepairs.length - 1) {
            this.invalidValueRepairIdx = 0
        }

        return repair
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

    protected waitForNextMessage(): Promise<string> {
        return new Promise((resolve) => {
            this.resolve = resolve
        })
    }

    public async handleMessageBody(body: string) {
        const resolve = this.resolve
        this.resolve = undefined
        resolve?.(body)
    }

    public isWaitingForInput() {
        return !!this.resolve
    }

    public destroy() {
        this.isDestroyed = true
    }
}
