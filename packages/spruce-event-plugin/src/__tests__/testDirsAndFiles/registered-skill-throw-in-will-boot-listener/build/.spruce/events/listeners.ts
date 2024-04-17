import { EventFeatureListener } from '@sprucelabs/spruce-event-utils'

const listeners: EventFeatureListener[] = [
    {
        eventName: 'my-cool-event',
        eventNamespace: '{{namespace}}',
        version: 'v2021_01_22',
        callback:
            require('../../listeners/{{namespace}}/my-cool-event.v2021_01_22.listener')
                .default,
    },
    {
        eventName: 'did-boot',
        eventNamespace: 'skill',
        version: 'v2021_03_22',
        callback: require('../../listeners/skill/did-boot.v2021_03_22.listener')
            .default,
    },
]

export default listeners
