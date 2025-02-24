import { SchemaRegistry } from '@sprucelabs/schema'
import { diskUtil, Skill } from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest, { assert } from '@sprucelabs/test-utils'
import {
    SkillFactoryOptions,
    TestBootOptions,
    TestBootWaitOptions,
} from '../types/skill.types'
import SkillTestBooter, { BootSkillAndWaitResults } from './TestSkillBooter'

export default class AbstractSkillTest extends AbstractSpruceTest {
    protected static registeredSkills: Skill[] = []
    protected static skillBootError?: any

    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()
        this.cwd = process.cwd()
    }

    protected static async afterEach() {
        await super.afterEach()

        SchemaRegistry.getInstance().forgetAllSchemas()

        for (const skill of this.registeredSkills) {
            await skill.kill()
        }

        this.registeredSkills = []

        if (this.skillBootError) {
            const err = this.skillBootError

            this.clearSkillBootErrors()

            const msg =
                'Skill had error during boot:\n\n' +
                (typeof err.prettyPrint === 'function'
                    ? err.prettyPrint()
                    : err.toString())

            assert.fail(msg)
        }
    }

    protected static clearSkillBootErrors() {
        this.skillBootError = undefined
    }

    protected static async Skill(options?: SkillFactoryOptions) {
        const skill = await SkillTestBooter.Skill({
            ...options,
            cwd: this.cwd,
            buildPath: this.resolvePath('build'),
        })

        this.registeredSkills.push(skill)

        return skill
    }

    protected static async bootSkill(options?: TestBootOptions) {
        const skill = options?.skill ?? (await this.Skill(options))
        return this.bootSkillAndWait(skill, options)
    }

    private static async bootSkillAndWait(
        skill: Skill,
        options?: TestBootWaitOptions
    ): Promise<BootSkillAndWaitResults> {
        const results = await SkillTestBooter.bootSkillAndWait({
            ...options,
            skill,
            onSuppressedError: (err: any) => {
                this.skillBootError = err
            },
        })

        return results as BootSkillAndWaitResults
    }

    protected static async bootSkillFromTestDir(
        key: string,
        options?: SkillFactoryOptions
    ) {
        const skill = await this.SkillFromTestDir(key, options)
        const results = await this.bootSkillAndWait(skill)

        return results
    }

    protected static async SkillFromTestDir(
        key: string,
        options?: SkillFactoryOptions
    ) {
        this.cwd = await this.copySkillFromTestDirToTmpDir(key)
        const skill = await this.Skill(options)

        return skill
    }

    private static async copySkillFromTestDirToTmpDir(
        testDirName: string
    ): Promise<string> {
        const newLocal = process.cwd()
        const destination = this.resolvePath(
            newLocal,
            'build',
            '__tests__',
            '/testDirsAndFiles/',
            `${new Date().getTime() * Math.random()}`
        )
        const source = this.resolveTestDirsAndFilesPath(testDirName)

        await diskUtil.copyDir(source, destination)
        return destination
    }

    protected static resolveTestDirsAndFilesPath(testDirName: string) {
        return this.resolvePath(
            process.cwd(),
            'build',
            '__tests__',
            '/testDirsAndFiles/',
            testDirName
        )
    }

    //instance implementation
    protected registeredSkills: Skill[] = []
    protected skillBootError?: any

    protected async beforeEach(): Promise<void> {
        await super.beforeEach()
        this.cwd = process.cwd()
    }

    protected async afterEach() {
        await super.afterEach()

        SchemaRegistry.getInstance().forgetAllSchemas()

        debugger

        for (const skill of this.registeredSkills) {
            await skill.kill()
        }

        this.registeredSkills = []

        if (this.skillBootError) {
            const err = this.skillBootError

            this.clearSkillBootErrors()

            const msg =
                'Skill had error during boot:\n\n' +
                (typeof err.prettyPrint === 'function'
                    ? err.prettyPrint()
                    : err.toString())

            assert.fail(msg)
        }
    }

    protected clearSkillBootErrors() {
        this.skillBootError = undefined
    }

    protected async Skill(options?: SkillFactoryOptions) {
        const skill = await SkillTestBooter.Skill({
            ...options,
            cwd: this.cwd,
            buildPath: this.resolvePath('build'),
        })

        this.registeredSkills.push(skill)

        return skill
    }

    protected async bootSkill(options?: TestBootOptions) {
        const skill = options?.skill ?? (await this.Skill(options))
        return this.bootSkillAndWait(skill, options)
    }

    private async bootSkillAndWait(
        skill: Skill,
        options?: TestBootWaitOptions
    ): Promise<BootSkillAndWaitResults> {
        const results = await SkillTestBooter.bootSkillAndWait({
            ...options,
            skill,
            onSuppressedError: (err: any) => {
                this.skillBootError = err
            },
        })

        return results as BootSkillAndWaitResults
    }

    protected async bootSkillFromTestDir(
        key: string,
        options?: SkillFactoryOptions
    ) {
        const skill = await this.SkillFromTestDir(key, options)
        const results = await this.bootSkillAndWait(skill)

        return results
    }

    protected async SkillFromTestDir(
        key: string,
        options?: SkillFactoryOptions
    ) {
        this.cwd = await this.copySkillFromTestDirToTmpDir(key)
        const skill = await this.Skill(options)

        return skill
    }

    private async copySkillFromTestDirToTmpDir(
        testDirName: string
    ): Promise<string> {
        const newLocal = process.cwd()
        const destination = this.resolvePath(
            newLocal,
            'build',
            '__tests__',
            '/testDirsAndFiles/',
            `${new Date().getTime() * Math.random()}`
        )
        const source = this.resolveTestDirsAndFilesPath(testDirName)

        await diskUtil.copyDir(source, destination)
        return destination
    }

    protected resolveTestDirsAndFilesPath(testDirName: string) {
        return this.resolvePath(
            process.cwd(),
            'build',
            '__tests__',
            '/testDirsAndFiles/',
            testDirName
        )
    }
}
