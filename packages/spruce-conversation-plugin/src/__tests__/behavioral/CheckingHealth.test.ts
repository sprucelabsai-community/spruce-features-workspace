import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import plugin from '../../plugins/conversation.plugin'
import AbstractConversationTest, {
	SkillFactoryOptions,
} from '../../tests/AbstractConversationTest'
import { ConversationHealthCheckResults } from '../../types/conversation.types'

export default class CheckingHealthTest extends AbstractConversationTest {
	@test()
	protected static async pluginReturnsInstance() {
		assert.isTrue(plugin instanceof Function)
	}

	@test()
	protected static registersWithSkill() {
		const skill = this.Skill()
		const features = skill.getFeatures()
		assert.isLength(features, 2)
	}

	@test()
	protected static async throwsWhenExecutingIfEventPluginMissing() {
		const health = await this.checkHealth({ plugins: [plugin] })

		assert.isEqual(health.conversation.status, 'failed')
		const err = health.conversation.errors?.[0]
		assert.isTruthy(err)

		errorAssertUtil.assertError(err, 'MISSING_DEPENDENCIES', {
			dependencies: ['event.plugin'],
		})
	}

	@test()
	protected static async returnsZeroStateResponseFromHealthCheckWhenNoConversations() {
		const healthCheck = await this.checkHealth()

		assert.isEqual(healthCheck.conversation.status, 'passed')
		assert.isEqualDeep(healthCheck.conversation.topics, [])
	}

	private static async checkHealth(options?: SkillFactoryOptions) {
		const skill = this.Skill(options)
		const healthCheck = (await skill.checkHealth()) as ConversationHealthCheckResults
		return healthCheck
	}

	@test()
	protected static async returnsHelpfulErrorWHenPassedBadConvos() {
		const healthCheck = await this.checkHealth({
			activeDir: this.resolvePath(
				__dirname,
				'..',
				'testDirsAndFiles',
				'bad-missing-params'
			),
		})

		assert.isEqual(healthCheck.conversation.status, 'failed')
		errorAssertUtil.assertError(
			healthCheck.conversation.errors?.[0] as Error,
			'CONVERSATION_PLUGIN_ERROR'
		)

		errorAssertUtil.assertError(
			healthCheck.conversation.errors?.[0].originalError as Error,
			'INVALID_TOPIC'
		)
	}

	@test()
	protected static async getsTopicsFromHealthCheck() {
		const healthCheck = await this.checkHealth({
			activeDir: this.resolvePath(__dirname, '..', 'testDirsAndFiles', 'good'),
		})

		assert.isLength(healthCheck.conversation.topics, 2)
		assert.isEqualDeep(healthCheck.conversation.topics, [
			'bookAppointment',
			'cancelAppointment',
		])
	}
}
