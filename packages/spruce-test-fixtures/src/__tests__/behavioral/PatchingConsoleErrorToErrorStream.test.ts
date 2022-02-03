import { testLog } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest } from '../..'

export default class PatchingConsoleErrorToErrorStreamTest extends AbstractSpruceFixtureTest {
	@test()
	protected static patchesConsoleError() {
		assert.isEqual(console.error, testLog.error)
		console.error('Should write to console')
	}
}
