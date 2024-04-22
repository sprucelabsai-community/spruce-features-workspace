import { assertOptions } from '@sprucelabs/schema'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { SkillContext } from '@sprucelabs/spruce-skill-utils'
import MessageGraphicsInterface from '../interfaces/MessageGraphicsInterface'
import {
    Script,
    ScriptPlayerOptions,
    SendMessageHandler,
    ScriptPlayerSendMessage,
    ScriptLine,
    DidMessageResponsePayload,
    ScriptLineCallbackOptions,
    ScriptLineCallback,
} from '../types/conversation.types'
import randomUtil from '../utilities/random.utility'

type MessageTarget = SpruceSchemas.Spruce.v2020_07_22.MessageTarget
type Message = SpruceSchemas.Spruce.v2020_07_22.Message

export class TopicScriptPlayer {
    private script: Script
    private sendMessageHandler: SendMessageHandler
    private target: MessageTarget
    private graphicsInterface: MessageGraphicsInterface
    private lineDelay: number
    private scriptState: Record<string, any> = {}
    private runningLine: any
    private scriptLineIndex = -1
    private getContext: () => SkillContext

    public constructor(options: ScriptPlayerOptions) {
        const { script, target, sendMessageHandler, lineDelay, getContext } =
            assertOptions(options, [
                'script',
                'sendMessageHandler',
                'target.personId',
                'getContext',
            ])

        this.script = script
        this.target = target
        this.sendMessageHandler = sendMessageHandler
        this.lineDelay = lineDelay ?? 2000
        this.getContext = getContext

        this.graphicsInterface =
            options.graphicsInterface ??
            new MessageGraphicsInterface({
                sendMessageHandler: this.sendMessage.bind(this),
            })
    }

    public async handleMessage(
        message: Message
    ): Promise<DidMessageResponsePayload | null> {
        let results: DidMessageResponsePayload | null

        if (this.graphicsInterface.isWaitingForInput()) {
            await this.graphicsInterface.handleMessageBody(message.body)

            results = await this.waitForRunningLineToResolveOrMoveOn()

            if (
                results &&
                (Object.keys(results).length > 0 ||
                    this.graphicsInterface.isWaitingForInput())
            ) {
                return results
            }
        }

        results = await this.play(message)

        if (!results) {
            return {
                transitionConversationTo: 'discovery',
            }
        }

        return results
    }

    private async play(message: Message) {
        let isFirstLine = this.scriptLineIndex === -1

        for (
            let idx = this.scriptLineIndex + 1;
            idx < this.script.length;
            idx++
        ) {
            this.scriptLineIndex = idx

            const line = this.script[idx]

            if (!isFirstLine) {
                await new Promise<void>((resolve) =>
                    setTimeout(resolve, this.lineDelay)
                )
            }

            isFirstLine = false

            const results = await this.handleLine(message, line)

            if (results && Object.keys(results).length > 0) {
                this.scriptLineIndex = -1
                return results
            } else if (this.graphicsInterface.isWaitingForInput()) {
                return results
            }
        }

        this.scriptLineIndex = -1

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
            return this.handleLineCallback(normalizedLine, message)
        }

        return null
    }

    private async handleLineCallback(
        line: ScriptLineCallback,
        message: Message
    ) {
        this.runningLine = {
            promise: line(this.buildCallbackOptions(message))
                .then((results) => {
                    this.runningLine.isDone = true
                    return results
                })
                .catch((err) => {
                    this.runningLine.isDone = true
                    throw err
                }),
            isDone: false,
        }

        return this.waitForRunningLineToResolveOrMoveOn()
    }

    private async waitForRunningLineToResolveOrMoveOn(): Promise<DidMessageResponsePayload> {
        if (this.runningLine) {
            let done = false

            do {
                await new Promise<void>((resolve) => setTimeout(resolve, 10))

                done =
                    this.runningLine?.isDone ||
                    this.graphicsInterface.isWaitingForInput()
            } while (!done)
        }

        if (this.runningLine.isDone) {
            const promise = this.runningLine.promise
            this.runningLine = undefined
            return promise
        }

        return {}
    }

    private buildCallbackOptions(message: Message): ScriptLineCallbackOptions {
        return {
            ui: this.graphicsInterface,
            state: this.scriptState,
            rand: randomUtil.rand,
            message,
            context: this.getContext(),
        }
    }

    protected pickRandomLine(line: any[]): ScriptLine {
        return randomUtil.rand(line)
    }

    private async sendMessage(message: ScriptPlayerSendMessage) {
        await this.sendMessageHandler({
            ...message,
            target: this.target,
            classification: 'transactional',
        })
    }
}
