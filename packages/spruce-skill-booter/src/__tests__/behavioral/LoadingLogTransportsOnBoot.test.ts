import { diskUtil, Log } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractSkillTest from '../../tests/AbstractSkillTest'

export default class LoadingLogTransportsOnBootTest extends AbstractSkillTest {
    protected static async beforeEach() {
        await super.beforeEach()
        delete process.env.TEST_LOG_DESTINATION
        delete process.env.LOG_TRANSPORT_PLUGIN_DIR
    }

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
    protected static async logTransportsSetAtBoot(
        value: string,
        level = 'info'
    ) {
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
        const skill = await this.bootMultipleLogsSkill()

        assert.isFalse(
            diskUtil.doesFileExist(this.warnPath),
            `Log written to ${this.warnPath}`
        )
        assert.isFalse(
            diskUtil.doesFileExist(this.logPath),
            `Log written to ${this.logPath}`
        )

        //@ts-ignore
        skill.log.warn('whaaa!?')
        //@ts-ignore
        skill.log.error('noooo!')

        const warnContents = diskUtil.readFile(this.warnPath)
        assert.doesInclude(warnContents, 'whaaa!?')
        assert.doesNotInclude(warnContents, 'nooo')

        const errContents = diskUtil.readFile(this.errorPath)
        assert.doesNotInclude(errContents, 'whaaa!?')
        assert.doesInclude(errContents, 'nooo')
    }

    @test()
    protected static async returningNullFromTransportIsIgnored() {
        await this.bootSkillFromTestDir('skill-with-null-log-transport')
    }

    @test()
    protected static async canSetLogTransportPluginDirOnEnv() {
        process.env.LOG_TRANSPORT_PLUGIN_DIR =
            this.resolveTestDirsAndFilesPath('logTransports1')
        process.env.TEST_LOG_DESTINATION = diskUtil.createTempDir()

        const skill = await this.bootMultipleLogsSkill()

        //@ts-ignore
        skill.log.info('hey!')

        const expectedPath = this.resolvePath(
            process.env.TEST_LOG_DESTINATION,
            'log.txt'
        )

        assert.isTrue(
            diskUtil.doesFileExist(expectedPath),
            `No log written to ${expectedPath}`
        )

        this.assertFileContentsEqual(
            expectedPath,
            'Skill :: hey!::fileTransport3'
        )

        //@ts-ignore
        skill.log.warn('oh no!')

        this.assertFileContentsEqual(this.warnPath, 'Skill :: oh no!')

        this.assertFileContentsEqual(
            expectedPath,
            'Skill :: oh no!::fileTransport3'
        )
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

    private static assertFileContentsEqual(
        expectedPath: string,
        expected: string
    ) {
        const transport1Contents = diskUtil.readFile(expectedPath)
        assert.isEqual(transport1Contents, expected)
    }

    private static get errorPath() {
        return diskUtil.resolvePath(this.cwd, 'error.txt')
    }

    private static get warnPath() {
        return diskUtil.resolvePath(this.cwd, 'warn.txt')
    }

    private static get logPath() {
        return diskUtil.resolvePath(this.cwd, 'log.txt')
    }

    private static async bootMultipleLogsSkill() {
        const { skill } = await this.bootSkillFromTestDir(
            'skill-with-multiple-log-transports'
        )

        return skill
    }

    protected static bootSkillFromTestDir(cacheDir: string) {
        return super.bootSkillFromTestDir(
            cacheDir, //@ts-ignore
            { log: null }
        )
    }
}
