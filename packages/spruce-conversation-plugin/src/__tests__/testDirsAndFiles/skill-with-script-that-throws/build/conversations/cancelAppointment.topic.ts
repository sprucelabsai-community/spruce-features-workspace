import { TopicDefinition } from '../../../../../types/conversation.types'

const topicDefinition: TopicDefinition = {
    label: 'Cancel appointment',
    utterances: [
        'Cancel appointment',
        'Can i cancel my appointment?',
        'cancel',
    ],
    script: [
        () => {
            throw new Error('In Script')
        },
    ],
}

export default topicDefinition
