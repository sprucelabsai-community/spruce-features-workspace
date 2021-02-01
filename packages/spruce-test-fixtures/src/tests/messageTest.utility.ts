import { Message } from './AbstractSpruceFixtureTest'

const messageTestUtility = {
	buildMessage<T extends Partial<Message>>(values: T): Message & T {
		return {
			id: '1234',
			dateCreated: new Date().getTime(),
			target: {},
			source: {},
			classification: 'incoming',
			...values,
		} as Message & T
	},
}

export default messageTestUtility
