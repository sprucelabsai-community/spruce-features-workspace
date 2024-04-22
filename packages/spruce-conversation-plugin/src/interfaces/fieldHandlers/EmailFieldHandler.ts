import { FieldFactory, TextFieldDefinition } from '@sprucelabs/schema'
import SpruceError from '../../errors/SpruceError'
import { ScriptPlayerSendMessageHandler } from '../../types/conversation.types'
import randomUtil from '../../utilities/random.utility'

export default class EmailFieldHandler {
    public static repairs = [
        "Hmm, that does't look like a good email, give it one more shot.",
        "I don't think that's a valid email. Try one more time.",
        "Wait, that isn't an email, is it? Can you try again?",
    ]

    public static async handle(options: {
        sendMessageHandler: ScriptPlayerSendMessageHandler
        waitForNextMessageHandler: () => Promise<string>
        definition: TextFieldDefinition
    }): Promise<string> {
        return await EmailFieldHandler.go(options)
    }

    private static async go(
        options: {
            sendMessageHandler: ScriptPlayerSendMessageHandler
            waitForNextMessageHandler: () => Promise<string>
            definition: TextFieldDefinition
        },
        attempt = 0
    ): Promise<string> {
        const { sendMessageHandler, definition, waitForNextMessageHandler } =
            options

        definition.label &&
            sendMessageHandler({
                body: definition.label,
            })

        const value = await waitForNextMessageHandler()

        const emailField = FieldFactory.Field('email', {
            type: 'email',
            isRequired: true,
        })

        const errs = emailField.validate(value)

        if (errs.length > 0) {
            if (attempt === 0) {
                return this.go(
                    {
                        ...options,
                        definition: {
                            ...options.definition,
                            label: randomUtil.rand(this.repairs),
                        },
                    },
                    attempt + 1
                )
            } else {
                throw new SpruceError({ code: 'ABORT' })
            }
        }

        return value
    }
}
