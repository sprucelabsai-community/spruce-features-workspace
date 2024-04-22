import { TextFieldDefinition } from '@sprucelabs/schema'
import { ScriptPlayerSendMessageHandler } from '../../types/conversation.types'

export default class TextFieldHandler {
    public static async handle(options: {
        sendMessageHandler: ScriptPlayerSendMessageHandler
        waitForNextMessageHandler: () => Promise<string>
        definition: TextFieldDefinition
    }): Promise<string> {
        const { sendMessageHandler, definition, waitForNextMessageHandler } =
            options

        definition.label &&
            sendMessageHandler({
                body: definition.label,
            })

        const value = await waitForNextMessageHandler()

        return value
    }
}
