import { TopicDefinition } from '../../../../../types/conversation.types'

const topicDefinition: TopicDefinition = {
    label: 'mixed strings and callback',
    utterances: ['mixed'],
    script: [
        'string 1',
        async (options) => {
            const answer = await options.ui.prompt({
                type: 'text',
                isRequired: true,
                label: 'prompt 1',
            })

            options.ui.renderLine(answer)
        },
        'string 2',
        async (options) => {
            const answer = await options.ui.prompt({
                type: 'text',
                isRequired: true,
                label: 'prompt 2',
            })

            options.ui.renderLine(answer)

            return {}
        },
        ['and done', 'and done', 'and done'],
    ],
}

export default topicDefinition
