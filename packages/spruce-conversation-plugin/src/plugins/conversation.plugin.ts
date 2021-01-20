import { Skill, SkillFeature } from '@sprucelabs/spruce-skill-utils'
import TopicLoader from '../conversations/TopicLoader'
import SpruceError from '../errors/SpruceError'
import { ConversationHealthCheckItem } from '../types/conversation.types'

export class ConversationFeature implements SkillFeature {
	private skill: Skill

	public constructor(skill: Skill) {
		this.skill = skill
	}

	public async execute(): Promise<void> {
		this.assertDependencies()
	}
	public async checkHealth(): Promise<ConversationHealthCheckItem> {
		this.assertDependencies()

		try {
			const topics = await TopicLoader.loadTopics(this.skill.activeDir)
			return {
				status: 'passed',
				topics: topics.map((t) => t.key),
			}
		} catch (err) {
			return {
				status: 'failed',
				topics: [],
				errors: [
					new SpruceError({
						code: 'CONVERSATION_PLUGIN_ERROR',
						originalError: err,
					}),
				],
			}
		}
	}
	private assertDependencies() {
		try {
			this.skill.getFeatureByCode('event')
		} catch {
			throw new SpruceError({
				code: 'MISSING_DEPENDENCIES',
				dependencies: ['event.plugin'],
			})
		}
	}

	public async isInstalled(): Promise<boolean> {
		return true
	}
}

export default (skill: Skill) => {
	const feature = new ConversationFeature(skill)
	skill.registerFeature('conversation', feature)
}
