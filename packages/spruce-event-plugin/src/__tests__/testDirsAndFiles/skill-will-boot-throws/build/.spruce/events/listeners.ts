import { EventFeatureListener } from '@sprucelabs/spruce-event-utils'

const listeners: EventFeatureListener[] = [
    {
        eventName: 'will-boot',
        eventNamespace: 'skill',
        version: 'v2021_03_22',
        callback:
            require('../../listeners/skill/will-boot.v2021_03_22.listener')
                .default,
    },
]

export default listeners
