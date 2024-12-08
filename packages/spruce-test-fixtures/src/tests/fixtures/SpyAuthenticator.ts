import {
    AuthenticatorImpl,
    Storage,
} from '@sprucelabs/heartwood-view-controllers'

export default class SpyAuthenticator extends AuthenticatorImpl {
    public constructor(storage: Storage) {
        super(storage)
    }

    public getEventEmitter() {
        return this.eventEmitter
    }
}
