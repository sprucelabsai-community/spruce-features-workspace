import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractConversationTest from '../../tests/AbstractConversationTest'
import TopicLoader from '../../topics/TopicLoader'

export default class TopicLoaderTest extends AbstractConversationTest {
    @test()
    protected static async loadsNoTopicsWithBadDir() {
        const source = this.resolvePath('doesNotExist')
        const topics = await TopicLoader.loadTopics(source)

        assert.isLength(topics, 0)
    }

    @test()
    protected static async throwsWhenLoadingEmpty() {
        const source = this.resolveTestPath('bad-empty')

        const err = await assert.doesThrowAsync(() =>
            TopicLoader.loadTopics(source)
        )

        errorAssert.assertError(err, 'INVALID_TOPIC', {
            topicScript: 'bookAppointment.topic',
        })
    }

    @test()
    protected static async throwsWhenMissingParameters() {
        const source = this.resolveTestPath('bad-missing-params')
        const err = await assert.doesThrowAsync(() =>
            TopicLoader.loadTopics(source)
        )

        errorAssert.assertError(err, 'INVALID_TOPIC', {
            topicScript: 'bookAppointment.topic',
        })

        //@ts-ignore
        const original = err.options.originalError

        errorAssert.assertError(original, 'MISSING_PARAMETERS', {
            parameters: ['label', 'utterances', 'script'],
        })
    }

    @test()
    protected static async canLoadTopics() {
        const scripts = await TopicLoader.loadTopics(
            this.resolveTestPath('good')
        )
        assert.isLength(scripts, 2)
    }

    @test()
    protected static async loadedTopicsSetKey() {
        const scripts = await TopicLoader.loadTopics(
            this.resolveTestPath('good')
        )
        assert.doesInclude(scripts, { key: 'bookAppointment' })
        assert.doesInclude(scripts, { key: 'cancelAppointment' })
    }
}
