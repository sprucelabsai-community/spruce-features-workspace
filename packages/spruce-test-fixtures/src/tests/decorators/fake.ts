import { generateId } from '@sprucelabs/data-stores'
import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { assertOptions, isValidNumber } from '@sprucelabs/schema'
import { assert } from '@sprucelabs/test'
import SpruceError from '../../errors/SpruceError'
import eventFaker from '../eventFaker'
import generateRandomName from '../fixtures/generateRandomName'
import { CoreSeedTargets } from './seed'

export default function fake(name: CoreSeedTargets, total: number) {
	assertOptions({ name, total }, ['name', 'total'])

	return async function (Class: any) {
		assert.isTruthy(
			Class.fakedOwner,
			`You gotta @faker.login(...) before you can create fake '${name}'!`
		)
		Class.fakedOrganizations = [{}]
	}
}

fake.login = (phone: string) => {
	assert.isTruthy(phone, `You need to pass a phone to 'faker.login(...)'`)
	assert.isTrue(
		isValidNumber(phone),
		`'${phone}' is not a valid phone. Try something like: 555-000-0000`
	)

	MercuryTestClient.setShouldRequireLocalListeners(true)

	return async function (Class: any) {
		const names = generateRandomName()
		const person = {
			phone,
			dateCreated: new Date().getTime(),
			id: generateId(),
			casualName: `${names.firstName} ${
				names.lastName ? names.lastName[0] + '.' : ''
			}`,
			...names,
		}

		Class.fakedOwner = person

		await fakeWhoAmI(person)

		await eventFaker.on('get-person::v2020_12_25', ({ target }) => {
			assert.isTruthy(
				target?.personId,
				`@fake only supports 'get-person::v2020_12_25' when passing an id. To fake more, use 'eventFaker.on(...)'.`
			)

			if (target.personId !== person.id) {
				throw new SpruceError({
					code: 'INVALID_TARGET',
					friendlyMessage: `I could not find the person you were looking for.`,
				})
			}

			return {
				person,
			}
		})
	}
}

async function fakeWhoAmI(person: {
	firstName: string
	lastName: string
	phone: string
	dateCreated: number
	id: string
	casualName: string
}) {
	await eventFaker.on('whoami::v2020_12_25', () => {
		return {
			auth: {
				person,
			},
			type: 'authenticated' as const,
		}
	})
}
