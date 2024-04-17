import { SpruceEventResponse } from '@sprucelabs/spruce-event-utils'

export default async (): SpruceEventResponse => {
    await new Promise<void>((resolve) => setTimeout(resolve, 5000))
    process.env.DID_HIT = 'true'
    return
}
