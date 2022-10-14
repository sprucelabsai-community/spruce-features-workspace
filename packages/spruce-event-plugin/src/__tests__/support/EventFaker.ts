import { eventFaker, SpruceSchemas } from '@sprucelabs/spruce-test-fixtures'

export default class EventFaker {
	public async fakeRegisterListeners(
		cb?: (targetAndPayload: RegisterListerTargetAndPayload) => void
	) {
		await eventFaker.on(
			'register-listeners::v2020_12_25',
			(targetAndPayload) => {
				cb?.(targetAndPayload)
				return {}
			}
		)
	}
}
export type RegisterListerTargetAndPayload =
	SpruceSchemas.Mercury.v2020_12_25.RegisterListenersEmitTargetAndPayload
