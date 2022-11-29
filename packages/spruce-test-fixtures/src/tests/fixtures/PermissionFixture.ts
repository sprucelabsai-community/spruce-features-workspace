export default class PermissionFixture {
	protected static beforeEach() {
		process.env.SHOULD_REGISTER_PERMISSIONS = 'false'
	}
}
