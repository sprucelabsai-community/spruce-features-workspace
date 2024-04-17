import { SpruceEventResponse } from '@sprucelabs/spruce-event-utils'

export default async (): SpruceEventResponse => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    throw Error('fail')
}
