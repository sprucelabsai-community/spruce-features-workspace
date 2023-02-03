import {
	Authorizer,
	AuthorizerCanOptions,
	SavePermissionsOptions,
} from '@sprucelabs/heartwood-view-controllers'
import { PermissionContractId, PermissionId } from '@sprucelabs/mercury-types'
import { assertOptions } from '@sprucelabs/schema'
import { assert } from '@sprucelabs/test-utils'

export default class FakeAuthorizer implements Authorizer {
	private fakedContracts: FakeOptions[] = []
	private lastSavePermissionOptions?: SavePermissionsOptions<any, any>

	public fakePermissions<
		ContractId extends PermissionContractId = PermissionContractId
	>(options: FakeOptions<ContractId>) {
		this.fakedContracts.unshift(options)
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

		const fakedContract = this.fakedContracts.find(
			(f) => f.contractId === contractId
		)

		this.assertValidContractId(fakedContract, contractId)

		const results: Record<Ids, boolean> = {} as Record<Ids, boolean>

		permissionIds.reverse()

		for (const actual of permissionIds) {
			const fakedPerm: Perm<ContractId> | undefined =
				fakedContract.permissions.find((p) => p.id === actual) as
					| Perm<ContractId>
					| undefined

			this.assertValidPermission<ContractId>(fakedPerm, actual, fakedContract)
			results[fakedPerm.id as Ids] = fakedPerm.can
		}

		return results
	}

	public async savePermissions<
		ContractId extends PermissionContractId,
		Ids extends PermissionId<ContractId>
	>(options: SavePermissionsOptions<ContractId, Ids>): Promise<void> {
		this.lastSavePermissionOptions = options
	}

	public getLastSavePermissionsOptions() {
		return this.lastSavePermissionOptions
	}

	private assertValidPermission<ContractId extends PermissionContractId>(
		fakedPerm: Perm<ContractId> | undefined,
		actual: PermissionId<ContractId>,
		faked: FakeOptions
	): asserts fakedPerm {
		assert.isTruthy(
			fakedPerm,
			`Oops! I could not find the permissionId '${actual}'! Make sure you faked it with 'this.views.getAuthorizer().fakePermissions(...)'

Valid permissions on this contract are: 

${faked.permissions.map((p) => p.id).join('\n')}`
		)
	}

	private assertValidContractId<ContractId extends PermissionContractId>(
		faked: FakeOptions | undefined,
		contractId: ContractId
	): asserts faked {
		assert.isTruthy(
			faked,
			`Contract with the id '${contractId}' not found! You need to tell the authorizer how to respond. Try 'this.views.getAuthorizer().fakePermissions(...)'

Valid contracts are: 

${this.fakedContracts.map((p) => p.contractId).join('\n')}`
		)
	}
}

interface Perm<ContractId extends PermissionContractId> {
	id: PermissionId<ContractId>
	can: boolean
}

interface FakeOptions<
	ContractId extends PermissionContractId = PermissionContractId
> {
	contractId: ContractId
	permissions: Perm<ContractId>[]
}
