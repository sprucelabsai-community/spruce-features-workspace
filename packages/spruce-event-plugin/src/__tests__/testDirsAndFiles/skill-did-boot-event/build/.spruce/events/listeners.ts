import { EventFeatureListener } from '@sprucelabs/spruce-event-utils'

const listeners: EventFeatureListener[] = [
    {
        eventName: 'did-boot',
        eventNamespace: 'skill',
        version: 'v2021_02_08',
        callback: require('../../listeners/skill/did-boot.v2021_02_08.listener')
            .default,
    },
]

export default listeners
