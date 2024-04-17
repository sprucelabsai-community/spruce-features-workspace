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
]

export default listeners
