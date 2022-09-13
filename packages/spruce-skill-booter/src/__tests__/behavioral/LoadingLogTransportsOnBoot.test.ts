import { diskUtil, Log } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractSkillTest from '../../tests/AbstractSkillTest'

export default class LoadingLogTransportsOnBootTest extends AbstractSkillTest {
	@test('throws with bad transport 1', 'skill-with-bad-log-transport')
	@test('throws with bad transport 2', 'skill-with-bad-log-transport-2')
	protected static async canCreateLoadingLogTransportsOnBoot() {
		const err = await assert.doesThrowAsync(() =>
			this.bootSkillFromTestDir('skill-with-bad-log-transport')
		)

		errorAssert.assertError(err, 'INVALID_LOG_TRANSPORT')
	}

	@test('logs expected value 1', 'hey!')
	@test('logs expected value 2', 'there!')
	@test('logs expected value 3', 'there!', 'error')
	protected static async logTransportsSetAtBoot(value: string, level = 'info') {
		const { skill } = await this.bootSkillFromTestDir(
			'skill-with-log-transport'
		)

		const logDestination = diskUtil.resolvePath(this.cwd, 'log.txt')
		assert.isTrue(
			diskUtil.doesFileExist(logDestination),
			`No log written to ${logDestination}`
		)

		//@ts-ignore
		const log = skill.log as Log

		//@ts-ignore
		log[level](value)

		const contents = diskUtil.readFile(logDestination)
		assert.doesInclude(contents, value)
	}

	@test()
	protected static async transportHonorsLevel() {
		const { skill } = await this.bootSkillFromTestDir(
			'skill-with-log-transport-info-only'
		)
		const logDestination = diskUtil.resolvePath(this.cwd, 'log.txt')
		assert.isTrue(
			diskUtil.doesFileExist(logDestination),
			`No log written to ${logDestination}`
		)

		//@ts-ignore
		const log = skill.log as Log

		const value = 'aoeuaoeu'

		//@ts-ignore
		log.warn(value)

		const contents = diskUtil.readFile(logDestination)
		assert.doesNotInclude(contents, value)
	}

	@test()
	protected static async canLoadMultipleTransports() {
		const { skill } = await this.bootSkillFromTestDir(
			'skill-with-multiple-log-transports'
		)

		const logDestination = diskUtil.resolvePath(this.cwd, 'log.txt')
		const warnDestination = diskUtil.resolvePath(this.cwd, 'warn.txt')
		const errDestination = diskUtil.resolvePath(this.cwd, 'error.txt')

		assert.isFalse(
			diskUtil.doesFileExist(warnDestination),
			`Log written to ${warnDestination}`
		)
		assert.isFalse(
			diskUtil.doesFileExist(logDestination),
			`Log written to ${logDestination}`
		)

		//@ts-ignore
		skill.log.warn('whaaa!?')
		//@ts-ignore
		skill.log.error('noooo!')

		const warnContents = diskUtil.readFile(warnDestination)
		assert.doesInclude(warnContents, 'whaaa!?')
		assert.doesNotInclude(warnContents, 'nooo')

		const errContents = diskUtil.readFile(errDestination)
		assert.doesNotInclude(errContents, 'whaaa!?')
		assert.doesInclude(errContents, 'nooo')
	}

	@test()
	protected static async cantSetSameLevelFor2Transports() {
		const err = await assert.doesThrowAsync(() =>
			this.bootSkillFromTestDir('skill-with-duplicate-transports')
		)

		errorAssert.assertError(err, 'DUPLICATE_LOG_TRANSPORT')
	}

	@test()
	protected static async returningNullFromTransportIsIgnored() {
		await this.bootSkillFromTestDir('skill-with-null-log-transport')
	}

	@test()
	protected static async logTransportIsSetOnContructionOfSkill() {
		const skill = await this.SkillFromTestDir(
			'skill-with-multiple-log-transports',
			//@ts-ignore
			{ log: null }
		)

		//@ts-ignore
		assert.isTruthy(skill._log)
	}

	protected static bootSkillFromTestDir(cacheDir: string) {
		return super.bootSkillFromTestDir(
			cacheDir, //@ts-ignore
			{ log: null }
		)
	}
}
