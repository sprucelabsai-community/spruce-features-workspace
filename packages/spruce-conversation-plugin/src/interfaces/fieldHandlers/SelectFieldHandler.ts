import { SelectFieldDefinition } from '@sprucelabs/schema'
import SpruceError from '../../errors/SpruceError'
import { FieldHandler } from '../../types/conversation.types'
import suggesterUtil from '../../utilities/suggester.utility'

function isNumeric(str: any) {
    if (typeof str != 'string') {
        return false
    } // we only process strings!
    return (
        !isNaN(+str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str))
    ) // ...and ensure strings of whitespace fail
}

export default class SelectFieldHandler {
    public static handle: FieldHandler<SelectFieldDefinition> = async (
        options
    ) => {
        const { sendMessageHandler, definition, waitForNextMessageHandler } =
            options

        let value: string | undefined

        definition.label &&
            sendMessageHandler({
                body: definition.label,
                //@ts-ignore
                choices: definition.options?.choices,
            })

        const response = await waitForNextMessageHandler()

        if (isNumeric(response)) {
            value = definition.options?.choices?.[parseInt(response) - 1]?.value

            if (!value) {
                return response
            }
        } else {
            const ranked = await suggesterUtil.rank(
                definition.options.choices.map((c) => ({
                    key: c.value,
                    phrase: `${c.value} ${c.label}`,
                })),
                response
            )

            if (ranked[0].score > 0.9) {
                value = ranked[0].key
            }
        }

        if (!value) {
            throw new SpruceError({ code: 'ABORT' })
        }

        return value
    }
}
