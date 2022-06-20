import { generateId } from '@sprucelabs/test-utils'
import eventFaker from '../../tests/eventFaker'

export default class EventFaker {
	public async fakeRegisterSkill() {
		await eventFaker.on('register-skill::v2020_12_25', () => {
			return {
				skill: {
					id: generateId(),
					creators: [{ personId: generateId() }],
					slug: generateId(),
					dateCreated: new Date().getTime(),
					name: generateId(),
					apiKey: generateId(),
				},
			}
		})
	}

	public async fakeUnregisterSkill() {
		await eventFaker.on('unregister-skill::v2020_12_25', () => {
			return {}
		})
	}

	public async fakeRegisterProxyToken() {
		await eventFaker.on('register-proxy-token::v2020_12_25', () => {
			return {
				token: generateId(),
			}
		})
	}
}
