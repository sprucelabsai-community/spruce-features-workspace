import { test, assert } from '@sprucelabs/test-utils'
import EmailFieldHandler from '../../../interfaces/fieldHandlers/EmailFieldHandler'
import AbstractGraphicsInterfaceTest from '../../../tests/AbstractGraphicsInterfaceTest'

export default class TextFieldTest extends AbstractGraphicsInterfaceTest {
    @test()
    protected static async promptSendsLabel() {
        void this.ui.prompt({
            type: 'email',
            label: 'Tell me about your life.',
        })

        assert.doesInclude(this.sentMessages, {
            body: 'Tell me about your life.',
        })
    }

    @test()
    protected static async noPromptSendsNoMessage() {
        void this.ui.prompt({
            type: 'email',
        })

        assert.isLength(this.sentMessages, 0)
    }

    @test()
    protected static async respondingWithBadEmailGivesYouAnotherChance() {
        EmailFieldHandler.repairs = ['repair', 'repair']

        let wasHit = false
        void this.ui
            .prompt({
                type: 'email',
                label: 'What is your email?',
            })
            .then(() => {
                wasHit = true
            })

        assert.isLength(this.sentMessages, 1)
        assert.doesInclude(this.sentMessages, { body: 'What is your email?' })

        await this.sendMessage('aoeuaoeu')

        assert.isLength(this.sentMessages, 2)
        assert.doesInclude(this.sentMessages, { body: 'repair' })

        assert.isFalse(wasHit)
    }

    @test()
    protected static async respondingWithBadEmail2TimesErrors() {
        const promise = this.ui.prompt({
            type: 'email',
            label: 'What is your email?',
        })

        assert.isLength(this.sentMessages, 1)
        assert.doesInclude(this.sentMessages, { body: 'What is your email?' })

        await this.sendMessage('aoeuaoeu')
        await this.sendMessage('aoeuaoeu')

        await assert.doesThrowAsync(() => promise)
    }
}
