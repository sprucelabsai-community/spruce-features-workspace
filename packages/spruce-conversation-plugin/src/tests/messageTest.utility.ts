import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'

export type Message = SpruceSchemas.Spruce.v2020_07_22.Message

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
