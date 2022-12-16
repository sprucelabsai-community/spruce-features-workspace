import FakeAuthorizer from '../FakeAuthorizer'

export default class PermissionFixture {
	public static beforeEach() {
		process.env.SHOULD_REGISTER_PERMISSIONS = 'false'
	}

	public getAuthorizer() {
		return FakeAuthorizer.getInstance()
	}
}
