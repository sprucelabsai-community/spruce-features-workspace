import { EventFeatureListener } from '@sprucelabs/spruce-event-utils'

const listeners: EventFeatureListener[] = [
    {
        eventName: 'did-boot',
        eventNamespace: 'skill',
        version: 'v2021_03_22',
        callback: require('../../listeners/skill/did-boot.v2021_03_22.listener')
            .default,
    },
]

export default listeners
