import { buildLog } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import AbstractSkillTest from '../../tests/AbstractSkillTest'

export default class BootingASkillTest extends AbstractSkillTest {
	@test()
	protected static async bootLoadsPluginsFromBuildDir() {
		await assert.doesThrowAsync(
			() => this.bootSkillFromTestDir('skill'),
			'LOADED CORRECTLY'
		)
	}

	@test()
	protected static async bootShouldNotStartCountdownUntilPostBoot() {
		this.cwd = process.cwd()

		const messages: string[] = []

		const logger = buildLog()
		logger.info = (...m: string[]) => {
			messages.push(...m)
			return m.join(' ')
		}

		const skill = await this.Skill({
			shouldCountdownOnExit: true,
			log: logger,
		})

		skill.registerFeature('test', {
			_isBooted: false,
			_bootHandler() {},
			onBoot(handler) {
				//@ts-ignore
				this._bootHandler = handler
			},
			async execute() {
				//@ts-ignore
				this._isBooted = true
				skill.onBoot(async () => {
					await new Promise((r) => setTimeout(r, 1000))
				})
				//@ts-ignore
				this._bootHandler()
			},
			//@ts-ignore
			async checkHealth() {},
			async isInstalled() {
				return true
			},
			async destroy() {},
			isBooted() {
				//@ts-ignore
				return this._isBooted
			},
		})

		await this.bootSkill({ skill, shouldWaitForLongRunningActions: false })

		let logged = messages.join(' ')
		assert.isFalse(logged.includes('Shutting down'))

		await this.wait(1000)

		logged = messages.join(' ')
		assert.isTrue(logged.includes('Shutting down'))
	}
}
