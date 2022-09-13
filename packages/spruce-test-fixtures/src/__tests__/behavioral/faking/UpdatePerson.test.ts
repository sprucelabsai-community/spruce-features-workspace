import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert, generateId } from '@sprucelabs/test-utils'
import { fake } from '../../..'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'

@fake.login()
export default class UpdatePersonTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async badUpdateThrowsBadTarget() {
		const err = await assert.doesThrowAsync(() =>
			this.fakedClient.emitAndFlattenResponses('update-person::v2020_12_25', {
				target: {
					personId: generateId(),
				},
			})
		)

		errorAssert.assertError(err, 'INVALID_TARGET')
	}
}
