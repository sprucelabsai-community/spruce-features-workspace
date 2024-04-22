import { assert } from '@sprucelabs/test'
import { TopicDefinition } from '../../../../../types/conversation.types'

const topicDefinition: TopicDefinition = {
    label: 'asserts good callback options',
    utterances: ['good options'],
    script: [
        async (options) => {
            assert.isTruthy(options)
            assert.isFunction(options.rand)
            assert.isTruthy(options.message)
            assert.isEqual(options.message.body, 'hello')
        },
        async (options) => {
            assert.isTruthy(options)
            assert.isFunction(options.rand)
            assert.isTruthy(options.message)
            assert.isEqual(options.message.body, 'hello')
        },
    ],
}

export default topicDefinition
