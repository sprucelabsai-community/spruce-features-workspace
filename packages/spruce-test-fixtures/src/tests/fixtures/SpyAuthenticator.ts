import { AuthenticatorImpl } from '@sprucelabs/heartwood-view-controllers'

export class SpyAuthenticator extends AuthenticatorImpl {
    public constructor(storage: Storage) {
        super(storage)
    }

    public getEventEmitter() {
        return this.eventEmitter
    }
}
