import {
    Authorizer,
    AuthorizerCanOptions,
    AuthorizerDoesHonorOptions,
    SavePermissionsOptions,
} from '@sprucelabs/heartwood-view-controllers'
import {
    PermissionContractId,
    PermissionId,
    SpruceSchemas,
} from '@sprucelabs/mercury-types'
import { assertOptions } from '@sprucelabs/schema'
import { assert } from '@sprucelabs/test-utils'

export default class FakeAuthorizer implements Authorizer {
    private fakedContracts: FakePermissionOptions[] = []
    private lastSavePermissionOptions?: SavePermissionsOptions<any, any>
    private lastCanOptions?: AuthorizerCanOptions<any>
    private lastDoesHonorContractOptions?: AuthorizerDoesHonorOptions<PermissionContractId>

    public fakePermissions<
        ContractId extends PermissionContractId = PermissionContractId,
    >(options: FakePermissionOptions<ContractId>) {
        this.fakedContracts.unshift(options)
    }

    public async can<
        ContractId extends PermissionContractId,
        Ids extends PermissionId<ContractId>,
    >(
        options: AuthorizerCanOptions<ContractId, Ids>
    ): Promise<Record<Ids, boolean>> {
        this.lastCanOptions = options

        const { contractId, permissionIds, target } = assertOptions(
            options as AuthorizerCanOptions<ContractId>,
            ['contractId', 'permissionIds']
        )

        const fakedContracts = this.getContractsFromId<ContractId>(contractId)
        const results: Record<Ids, boolean> = {} as Record<Ids, boolean>

        permissionIds.reverse()

        const fakedPermissions = fakedContracts.reduce((acc, fakedContract) => {
            const fakedPerms = fakedContract.permissions.filter((p) =>
                permissionIds.includes(p.id as Ids)
            ) as Perm<ContractId>[]
            return acc.concat(fakedPerms)
        }, [] as Perm<ContractId>[])

        for (const fakedContract of fakedContracts) {
            for (const actual of permissionIds) {
                const fakedPerm: Perm<ContractId> | undefined =
                    fakedPermissions.find((p) => p.id === actual) as
                        | Perm<ContractId>
                        | undefined

                this.assertValidPermission<ContractId>(
                    fakedPerm,
                    actual,
                    fakedContract
                )
                results[fakedPerm.id as Ids] =
                    results[fakedPerm.id as Ids] ||
                    (fakedPerm.can &&
                        (!fakedContract.target ||
                            (fakedContract.target?.organizationId ===
                                target?.organizationId &&
                                fakedContract.target?.locationId ===
                                    target?.locationId)))
            }
        }

        return results
    }

    private getContractsFromId<ContractId extends PermissionContractId>(
        contractId: ContractId
    ) {
        const fakedContracts = this.fakedContracts.filter(
            (f) => f.contractId === contractId
        )

        this.assertValidContractId(fakedContracts[0], contractId)

        return fakedContracts
    }

    private getContractFromId<ContractId extends PermissionContractId>(
        contractId: ContractId
    ) {
        const fakedContract = this.fakedContracts.find(
            (f) => f.contractId === contractId
        )

        this.assertValidContractId(fakedContract, contractId)
        return fakedContract
    }

    public getLastCanOptions(): AuthorizerCanOptions<any> | undefined {
        return this.lastCanOptions
    }

    public async savePermissions<
        ContractId extends PermissionContractId,
        Ids extends PermissionId<ContractId>,
    >(options: SavePermissionsOptions<ContractId, Ids>): Promise<void> {
        this.lastSavePermissionOptions = options
    }

    public getLastSavePermissionsOptions<
        ContractId extends PermissionContractId = PermissionContractId,
        Ids extends PermissionId<ContractId> = PermissionId<ContractId>,
    >(): SavePermissionsOptions<ContractId, Ids> {
        return this.lastSavePermissionOptions as SavePermissionsOptions<
            ContractId,
            Ids
        >
    }

    private assertValidPermission<ContractId extends PermissionContractId>(
        fakedPerm: Perm<ContractId> | undefined,
        actual: PermissionId<ContractId>,
        faked: FakePermissionOptions
    ): asserts fakedPerm {
        assert.isTruthy(
            fakedPerm,
            `Oops! I could not find the permissionId '${actual}'! Make sure you faked it with 'this.views.getAuthorizer().fakePermissions(...)'

Valid permissions on this contract are: 

${faked.permissions.map((p) => p.id).join('\n')}`
        )
    }

    private assertValidContractId<ContractId extends PermissionContractId>(
        faked: FakePermissionOptions | undefined,
        contractId: ContractId
    ): asserts faked {
        assert.isTruthy(
            faked,
            `Contract with the id '${contractId}' not found! You need to tell the authorizer how to respond. Try 'this.views.getAuthorizer().fakePermissions(...)'

Valid contracts are: 

${this.fakedContracts.map((p) => p.contractId).join('\n')}`
        )
    }

    // WARNING - does not yet support targetting
    public async doesHonorPermissionContract<
        ContractId extends PermissionContractId,
    >(options: AuthorizerDoesHonorOptions<ContractId>): Promise<boolean> {
        const { contractId } = assertOptions(options, ['contractId'])

        this.lastDoesHonorContractOptions = options
        const contract = this.getContractFromId(contractId)
        return contract.permissions.filter((p) => p.can).length > 0
    }

    public getLastDoesHonorContractOptions() {
        return this.lastDoesHonorContractOptions
    }
}

interface Perm<ContractId extends PermissionContractId> {
    id: PermissionId<ContractId>
    can: boolean
}

export type PermissionContractTarget =
    SpruceSchemas.Mercury.v2020_12_25.GetResolvedPermissionsContractEmitTarget

export interface FakePermissionOptions<
    ContractId extends PermissionContractId = PermissionContractId,
> {
    contractId: ContractId
    permissions: Perm<ContractId>[]
    target?: PermissionContractTarget
}
