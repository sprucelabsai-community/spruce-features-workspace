export default class EventFixture {
	public static beforeEach() {
		process.env.SHOULD_CACHE_EVENT_REGISTRATIONS = 'true'
		process.env.SHOULD_CACHE_LISTENER_REGISTRATIONS = 'true'
	}
}
