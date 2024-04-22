import { FieldDefinitions, FieldDefinitionValueType } from '@sprucelabs/schema'
import { SelectChoice } from '@sprucelabs/spruce-core-schemas'
import AbstractSpruceTest, {
    test,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import MockMessageInterface, {
    FieldType,
} from '../../../interfaces/MockMessageInterface'

export default class SpyMessageInterfaceTest extends AbstractSpruceTest {
    private static ui: MockMessageInterface
    protected static async beforeEach() {
        await super.beforeEach()
        this.ui = MockMessageInterface.Ui()
    }

    protected static async afterEach() {
        await super.afterEach()
        MockMessageInterface.afterEach()
    }

    @test()
    protected static async knowsIfDidntPromp() {
        this.assertNotJustPromptedFor('number')
    }

    @test()
    protected static async holdsUntilPromptIsAnswered() {
        const promise = this.prompt({ type: 'text' })
        const expected = generateId()
        this.ui.answerPrompt(expected)
        const answer = await promise
        assert.isEqual(answer, expected)
    }

    @test()
    protected static async tracksPrompts() {
        void this.prompt({
            type: 'number',
            isRequired: true,
        })

        this.ui.assertJustPromptedFor('number')
        this.assertNotJustPromptedFor('text')
        this.resetUi()
    }

    @test()
    protected static async throwsIfRenderedAfterPrompt() {
        void this.prompt({
            type: 'number',
            isRequired: true,
        })

        this.ui.renderLine('go dogs go!')
        this.assertNotJustPromptedFor('number')
        this.resetUi()
    }

    @test()
    protected static async canAssertSelectChoices() {
        this.promptWithChoices([
            {
                label: 'Hey',
                value: 'hello',
            },
        ])

        assert.doesThrow(() =>
            this.assertPromptedWithChoices([
                {
                    value: 'what the!?',
                },
            ])
        )

        this.assertPromptedWithChoices([
            {
                value: 'hello',
            },
        ])

        this.resetUi()
    }

    @test()
    protected static async canAssertDifferentSelectChoices() {
        const value = generateId()
        this.promptWithChoices([
            {
                value,
                label: 'What theee!!!!??',
            },
            { value: 'hello', label: 'Hello!' },
        ])

        this.assertPromptedWithChoices([
            {
                value,
            },
            {
                value: 'hello',
            },
        ])

        this.resetUi()
    }

    @test()
    protected static async canAssertIfRequired() {
        void this.prompt({
            type: 'number',
            options: {
                min: 0,
                max: 100,
            },
        })

        assert.doesThrow(() =>
            this.ui.assertJustPromptedFor('number', { min: 10, max: 20 })
        )
        this.ui.assertJustPromptedFor('number', { min: 0, max: 100 })
        this.resetUi()
    }

    private static assertPromptedWithChoices(
        expected: Partial<SelectChoice>[]
    ): any {
        return this.ui.assertJustPromptedFor('select', {
            choices: expected,
        })
    }

    private static promptWithChoices(choices: SelectChoice[]) {
        void this.prompt({
            type: 'select',
            options: {
                choices,
            },
        })
    }

    private static resetUi() {
        this.ui.reset()
    }

    private static prompt<T extends FieldDefinitions>(
        definition: T
    ): Promise<FieldDefinitionValueType<T, false>> {
        return this.ui.prompt(definition)
    }

    private static assertNotJustPromptedFor(type: FieldType) {
        assert.doesThrow(() => this.ui.assertJustPromptedFor(type))
    }
}
