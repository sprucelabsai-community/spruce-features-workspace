import { test } from '@sprucelabs/test-utils'
import { AbstractSpruceFixtureTest } from '../..'

export default class PatchingConsoleErrorToErrorStreamTest extends AbstractSpruceFixtureTest {
    @test()
    protected static patchesConsoleError() {
        console.error('Should write error to console, confirm with your eyes')
        console.info('Should not write info to console, confirm with your eyes')
        console.warn('Should not write warn to console, confirm with your eyes')
    }
}
