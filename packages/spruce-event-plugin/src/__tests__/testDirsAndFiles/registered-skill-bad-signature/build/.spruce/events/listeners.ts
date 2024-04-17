import { EventFeatureListener } from '@sprucelabs/spruce-event-utils'

const listeners: EventFeatureListener[] = [
    {
        eventName: 'my-bad-sig-event',
        eventNamespace: '{{namespace}}',
        version: 'v2021_01_22',
        callback:
            require('../../listeners/{{namespace}}/my-bad-sig-event.v2021_01_22.listener')
                .default,
    },
]

export default listeners
