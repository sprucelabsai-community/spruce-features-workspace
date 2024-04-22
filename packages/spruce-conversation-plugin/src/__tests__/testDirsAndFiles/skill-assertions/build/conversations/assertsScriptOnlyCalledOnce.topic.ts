import { assert } from '@sprucelabs/test'
import { TopicDefinition } from '../../../../../types/conversation.types'

const topicDefinition: TopicDefinition = {
    label: 'asserts only called once',
    utterances: ['only called once'],
    script: [
        async (options) => {
            assert.isFalsy(options.state.hasBeenRun)
            options.state.hasBeenRun = true
        },
    ],
}

export default topicDefinition
