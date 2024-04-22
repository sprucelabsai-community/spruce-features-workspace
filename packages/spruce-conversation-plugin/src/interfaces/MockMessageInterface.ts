import {
    FieldDefinitions,
    FieldDefinitionValueType,
    selectAssert,
    SelectFieldDefinition,
} from '@sprucelabs/schema'
import { assert } from '@sprucelabs/test-utils'
import MessageGraphicsInterface from './MessageGraphicsInterface'

type ResolveCallback = (value: string | number | null) => void

export default class MockMessageInterface extends MessageGraphicsInterface {
    private static alreadyExists = false
    private static lastPrompt: FieldDefinitions | null = null
    private promptResolve?: ResolveCallback
    private static isPrompting = false

    private constructor() {
        super({
            sendMessageHandler: async () => {
                this.clearLastPrompt()
            },
        })
    }

    public static Ui() {
        assert.isFalse(
            this.alreadyExists,
            `You gotta call Ui.afterEach() after each test!`
        )
        this.alreadyExists = true
        return new this()
    }

    public static afterEach() {
        if (this.isPrompting) {
            assert.fail(
                'You have a dangling prompt!! Send some input or call ui.reset()'
            )
        }
        this.alreadyExists = false
    }

    public reset() {
        this.clearLastPrompt()
        this.isPrompting = false
    }

    private clearLastPrompt() {
        this.lastPrompt = null
    }

    public async prompt<T extends FieldDefinitions>(
        definition: T
    ): Promise<FieldDefinitionValueType<T, false>> {
        this.lastPrompt = definition
        this.isPrompting = true
        return new Promise((r) => {
            this.promptResolve = r as ResolveCallback
        })
    }

    public answerPrompt(value: string | number | null) {
        this.isPrompting = false
        this.clearLastPrompt()
        this.promptResolve?.(value)
    }

    public assertJustPromptedFor<T extends FieldDefinitions>(
        type: T['type'],
        options?: T['options']
    ): any {
        assert.isEqual(
            this.lastPrompt?.type,
            type,
            `You did not prompt for a '${type}'!`
        )

        if (options) {
            if (!this.assertValidChoices<T>(options)) {
                assert.doesInclude(
                    this.lastPrompt?.options,
                    options,
                    `Your prompt options are not what I expected!`
                )
            }
        }
    }

    private assertValidChoices<T extends FieldDefinitions>(
        options: T['options']
    ) {
        const choices = (
            this.lastPrompt?.options as SelectFieldDefinition['options']
        )?.choices

        if (choices) {
            selectAssert.assertSelectChoicesMatch(
                choices!,
                (options as SelectFieldDefinition['options']).choices.map(
                    (c) => c.value
                )
            )

            return true
        }

        return false
    }

    private get lastPrompt() {
        return MockMessageInterface.lastPrompt
    }

    private set lastPrompt(prompt: FieldDefinitions | null) {
        MockMessageInterface.lastPrompt = prompt
    }

    private get isPrompting() {
        return MockMessageInterface.isPrompting
    }
    private set isPrompting(prompt: boolean) {
        MockMessageInterface.isPrompting = prompt
    }
}
export type FieldType = FieldDefinitions['type']
