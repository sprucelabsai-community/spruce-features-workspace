import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert, generateId } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import FakeAuthorizer from '../../../tests/FakeAuthorizer'
import PermissionFixture from '../../../tests/fixtures/PermissionFixture'

export default class CheckingPermissionsTest extends AbstractSpruceFixtureTest {
	private static contractId: string

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		this.contractId = generateId()
	}

	@test()
	protected static async canCreateCheckingPermissions() {
		assert.isTrue(this.instance instanceof FakeAuthorizer)
	}

	@test()
	protected static async sharesInstances() {
		assert.isEqual(this.instance, this.instance)
	}

	@test()
	protected static async permsFixtureResetsInstance() {
		const instance = this.instance
		PermissionFixture.beforeEach()
		assert.isNotEqual(this.instance, instance)
	}

	@test()
	protected static async throwsWhenMissingOnCan() {
		const err = await assert.doesThrowAsync(() =>
			//@ts-ignore
			this.instance.can()
		)

		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['contractId', 'permissionIds'],
		})
	}

	@test()
	protected static async throwsWhenNotSettingResponse() {
		await this.assertThrowsFakeError()
	}

	@test()
	protected static async throwsWhenContractIdNotFaked() {
		this.fakePermissions([{ id: 'test', can: true }])
		this.changeContractId()
		await this.assertThrowsFakeError()
	}

	@test()
	protected static async doesNotThrowWhenMatchingSecondContractId() {
		this.fakePermissions([{ id: 'test', can: true }])
		this.changeContractId()
		this.fakePermissions([{ id: 'test2', can: true }])
		await this.can(['test2'])
	}

	@test()
	protected static async throwsWhenNotFindingPermissionId() {
		this.fakePermissions([{ id: 'test', can: true }])
		await this.assertPermNotFound(['test2'], 'test2')
	}

	@test()
	protected static async throwsWhenFindingLaterMissingPermId() {
		this.fakePermissions([{ id: 'test', can: true }])
		await this.assertPermNotFound(['test', 'test2'], 'test2')
	}

	@test('returns false on can 1', ['first', 'second', 'third'], false)
	@test('returns false on can 2', ['third', 'fourth'], false)
	@test('returns false on can 3', ['first', 'second', 'third'], true)
	@test('returns false on can 4', ['third', 'fourth'], true)
	protected static async returnsFakedResponses(
		permissionIds: string[],
		can: boolean
	) {
		const faked: { id: string; can: boolean }[] = []
		const expected: Record<string, boolean> = {}
		permissionIds.forEach(
			(id) => ((expected[id] = can), faked.push({ id, can }))
		)

		this.fakePermissions(faked)

		const results = await this.can(permissionIds)

		assert.isEqualDeep(results, expected)
	}

	@test()
	protected static async fixtureAndLoadOptionsShareAuthorizer() {
		this.setupEmptyViewFixture()
		const auth = this.permissions.getAuthorizer()
		const router = this.views.getRouter()
		assert.isEqual(auth, router.buildLoadOptions().authorizer)
	}

	@test()
	protected static async authorizerClobbersMatchingContracts() {
		this.fakePermissions([{ id: 'test', can: true }])
		this.fakePermissions([{ id: 'test', can: false }])
		const perms = await this.can(['test'])
		assert.isFalse(perms['test'])
	}

	@test()
	protected static async usesLatestMatchWhenMultipleSent() {
		this.fakePermissions([
			{ id: 'test', can: false },
			{ id: 'test2', can: false },
		])
		this.fakePermissions([
			{ id: 'test', can: true },
			{ id: 'test2', can: false },
		])

		const perms = await this.can(['test', 'test2'])
		assert.isTrue(perms['test'])
		assert.isFalse(perms['test2'])
	}

	@test()
	protected static async canHandleMulplePermissionsWithDifferentContracts() {
		const firstId = this.contractId
		this.fakePermissions([{ id: 'test', can: true }])
		this.changeContractId()
		this.fakePermissions([{ id: 'test', can: false }])
		this.contractId = firstId
		const perms = await this.can(['test'])
		assert.isTrue(perms['test'])
	}

	@test()
	protected static async sameAuthorizerAsViews() {
		this.setupEmptyViewFixture()
		const auth1 = this.views.getAuthorizer()
		const auth2 = this.permissions.getAuthorizer()
		assert.isEqual(auth1, auth2)
	}

	@test()
	protected static async sameAuthenticatorAsViews() {
		this.setupEmptyViewFixture()
		const auth1 = this.views.getAuthenticator()
		const auth2 = this.permissions.getAuthenticator()
		assert.isEqual(auth1, auth2)
	}

	private static async assertPermNotFound(checkIds: string[], id: string) {
		await assert.doesThrowAsync(() => this.can(checkIds), id)
	}

	private static changeContractId() {
		this.contractId = generateId()
	}

	private static async assertThrowsFakeError() {
		await assert.doesThrowAsync(
			() => this.can(['test']),
			`Contract with the id of '${this.contractId}'`
		)
	}

	private static fakePermissions(faked: { id: string; can: boolean }[]) {
		this.instance.fakePermissions({
			contractId: this.contractId as any,
			permissions: faked as any,
		})
	}

	private static can(permissionIds: string[]) {
		return this.instance.can({
			contractId: this.contractId as any,
			permissionIds: permissionIds as any,
		})
	}

	private static setupEmptyViewFixture() {
		this.views = this.Fixture('view', {
			controllerMap: {},
		})
	}

	private static get instance() {
		return this.permissions.getAuthorizer()
	}
}
