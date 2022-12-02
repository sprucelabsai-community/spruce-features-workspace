import {
	Authorizer,
	AuthorizerCanOptions,
} from '@sprucelabs/heartwood-view-controllers'
import { PermissionContractId, PermissionId } from '@sprucelabs/mercury-types'
import { assertOptions } from '@sprucelabs/schema'
import { assert } from '@sprucelabs/test-utils'

export default class SpyAuthorizer implements Authorizer {
	private static instance?: SpyAuthorizer
	private fakedPermissions: FakeOptions[] = []

	public static getInstance() {
		if (!this.instance) {
			this.instance = new this()
		}
		return this.instance
	}

	public static reset() {
		this.instance = undefined
	}

	public fakePermissions(options: FakeOptions) {
		this.fakedPermissions.unshift(options)
	}

	public async can<
		ContractId extends PermissionContractId,
		Ids extends PermissionId<ContractId>
	>(
		options: AuthorizerCanOptions<ContractId, Ids>
	): Promise<Record<Ids, boolean>> {
		const { contractId, permissionIds } = assertOptions(
			options as AuthorizerCanOptions<ContractId>,
			['contractId', 'permissionIds']
		)

		const faked = this.fakedPermissions.find((f) => f.contractId === contractId)

		assert.isTruthy(
			faked,
			`Contract by the id '${contractId}' not found! You need to tell the authorizer how to respond. Try 'this.views.getAuthorizer().fakePermissions(...)'

Valid contracts are: 

${this.fakedPermissions.map((p) => p.contractId).join('\n')}`
		)

		const results: Record<Ids, boolean> = {} as Record<Ids, boolean>

		for (const actual of permissionIds) {
			const fakedPerm: Perm | undefined = faked.permissions.find(
				(p) => p.id === actual
			)
			assert.isTruthy(
				fakedPerm,
				`Oops! I could not find the permissionId '${actual}'! Make sure you faked it with 'this.views.getAuthorizer().fakePermissions(...)'

Valid permissions on this contract are: 

${faked.permissions.map((p) => p.id).join('\n')}`
			)

			//@ts-ignore
			permissionIds.forEach((id) => (results[id] = fakedPerm.can))
		}

		return results
	}
}

interface Perm {
	id: string
	can: boolean
}

interface FakeOptions {
	contractId: string
	permissions: Perm[]
}
