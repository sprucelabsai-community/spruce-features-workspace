import {
    AuthorizerCanOptions,
    AuthorizerDoesHonorOptions,
    SavePermissionsOptions,
} from '@sprucelabs/heartwood-view-controllers'
import { PermissionContractId, PermissionId } from '@sprucelabs/mercury-types'
import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert, generateId } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import FakeAuthorizer, {
    FakePermissionOptions,
    PermissionContractTarget,
} from '../../../tests/FakeAuthorizer'
import PermissionFixture from '../../../tests/fixtures/PermissionFixture'

export default class CheckingPermissionsTest extends AbstractSpruceFixtureTest {
    private static contractId: PermissionContractId

    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()
        this.contractId = generateId() as PermissionContractId
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
        this.fakePermissions([{ id: 'test' as any, can: true }])
        this.changeContractId()
        await this.assertThrowsFakeError()
    }

    @test()
    protected static async doesNotThrowWhenMatchingSecondContractId() {
        this.fakePermissions([{ id: 'test' as any, can: true }])
        this.changeContractId()
        this.fakePermissions([{ id: 'test2' as any, can: true }])
        await this.can(['test2'])
    }

    @test()
    protected static async throwsWhenNotFindingPermissionId() {
        this.fakePermissions([{ id: 'test' as any, can: true }])
        await this.assertPermNotFound(['test2'], 'test2')
    }

    @test()
    protected static async throwsWhenFindingLaterMissingPermId() {
        this.fakePermissions([{ id: 'test' as any, can: true }])
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

        this.fakePermissions(faked as any)

        const results = await this.can(permissionIds)

        assert.isEqualDeep(results, expected)
    }

    @test()
    protected static async fixtureAndLoadOptionsShareAuthorizer() {
        this.setupEmptyViewFixture()
        const auth = this.auth
        const router = this.views.getRouter()
        assert.isEqual(auth, router.buildLoadOptions().authorizer)
    }

    @test()
    protected static async authorizerClobbersMatchingContracts() {
        this.fakePermissions([{ id: 'test' as any, can: true }])
        this.fakePermissions([{ id: 'test' as any, can: false }])
        const perms = await this.can(['test'])
        assert.isFalse(perms['test'])
    }

    @test()
    protected static async usesLatestMatchWhenMultipleSent() {
        this.fakePermissions([
            { id: 'test' as any, can: false },
            { id: 'test2' as any, can: false },
        ])
        this.fakePermissions([
            { id: 'test' as any, can: true },
            { id: 'test2' as any, can: false },
        ])

        const perms = await this.can(['test', 'test2'])
        assert.isTrue(perms['test'])
        assert.isFalse(perms['test2'])
    }

    @test()
    protected static async canHandleMulplePermissionsWithDifferentContracts() {
        const firstId = this.contractId
        this.fakePermissions([{ id: 'test' as any, can: true }])
        this.changeContractId()
        this.fakePermissions([{ id: 'test' as any, can: false }])
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

    @test()
    protected static async canSpyOnSavePermissions() {
        await this.assertSpysOnOptionsWhenSaving({
            contractId: 'events-contract',
            target: {},
            permissions: [],
        })

        await this.assertSpysOnOptionsWhenSaving({
            contractId: 'feed-contract',
            target: {
                locationId: generateId(),
                personId: generateId(),
            },
            permissions: [
                {
                    id: 'can-see-other-persons-feed',
                    can: {
                        clockedIn: true,
                    },
                },
            ],
        })
    }

    @test('can see last can options 1', {
        contractId: 'events-contract',
        permissionIds: ['can-register-global-events'],
        target: {},
    })
    @test('can see last can options 2', {
        contractId: 'events-contract-2',
        permissionIds: [
            'can-register-global-events',
            'can-register-global-events-2',
        ],
        target: {
            personId: generateId(),
        },
    })
    protected static async canSeeLastCanOptions(
        can: AuthorizerCanOptions<any>
    ) {
        await this.assertCanOptionsMatch(can)
    }

    @test()
    protected static async returnsFalsIfTargetDoesNotMatch() {
        const permissionId = this.generateRandomPermissionId()

        this.fakePermissions(
            [
                {
                    id: permissionId,
                    can: true,
                },
            ],
            {
                organizationId: generateId(),
            }
        )

        await this.assertCant(permissionId)
    }

    @test()
    protected static async matchesIfFirstTargetMatchesOnOrgId() {
        const contractid = this.generateRandomPermissionId()

        const target = {
            organizationId: generateId(),
        }
        this.fakePermissions(
            [
                {
                    id: contractid,
                    can: true,
                },
            ],
            target
        )

        await this.assertCan(contractid, target)
    }

    @test()
    protected static async matchesIfFirstTargetMatchesOnLocationId() {
        const contractid = this.generateRandomPermissionId()

        const target = {
            locationId: generateId(),
        }

        this.fakePermissions(
            [
                {
                    id: contractid,
                    can: true,
                },
            ],
            target
        )

        await this.assertCan(contractid, target)
    }

    private static async assertCan(
        contractid: PermissionContractId,
        target?: PermissionContractTarget
    ) {
        const perms = await this.can([contractid], target)
        assert.isTrue(perms[contractid])
    }

    private static async assertCant(permissionId: any) {
        const perms = await this.can([permissionId])
        assert.isFalse(perms[permissionId])
    }

    private static async assertCanOptionsMatch(can: AuthorizerCanOptions<any>) {
        const { contractId } = can
        this.auth.fakePermissions({
            contractId: contractId as any,
            permissions: [
                {
                    id: 'can-register-global-events',
                    can: true,
                },
                {
                    id: 'can-register-global-events-2',
                    can: true,
                },
                {
                    id: 'can-register-global-events-3',
                    can: true,
                },
            ],
        })

        await this.auth.can(can)
        assert.isEqualDeep(this.auth.getLastCanOptions(), can)
    }

    @test()
    protected static async doesHonorContractThrowsWithMissing() {
        const err = await assert.doesThrowAsync(() =>
            //@ts-ignore
            this.instance.doesHonorPermissionContract()
        )

        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['contractId'],
        })
    }

    @test()
    protected static async doesHonorContractThrowsWithBadContractId() {
        await assert.doesThrowAsync(() =>
            this.doesHonorPermissionContract({
                contractId: generateId() as PermissionContractId,
            })
        )
    }

    @test()
    protected static async doesHonorDoesNotThrowWithGoodContractId() {
        this.fakePermissions([])
        await this.doesHonorPermissionContract()
    }

    @test()
    protected static async doesHonorReturnsFalseIfPermissionNotTrue() {
        this.fakePermissions([])
        await this.assertDoesNotHonorPermissionContract()
    }

    @test()
    protected static async doesHonorReturnsTrueIfFirstPermissionIsTrue() {
        this.fakePermissions([
            { id: this.generateRandomPermissionId(), can: true },
        ])
        await this.assertDoesHonorPermissionContract()
    }

    @test()
    protected static async doesHonorReturnsTrueIfSecondPermissionIsTrue() {
        this.fakePermissions([
            {
                id: this.generateRandomPermissionId(),
                can: false,
            },
            { id: this.generateRandomPermissionId(), can: true },
        ])
        await this.assertDoesHonorPermissionContract()
    }

    private static generateRandomPermissionId() {
        return generateId() as any
    }

    @test()
    protected static async doesHonorReturnsFalseIfAllPermissionsAreFalse() {
        this.fakePermissions([
            { id: this.generateRandomPermissionId(), can: false },
            { id: this.generateRandomPermissionId(), can: false },
        ])
        await this.assertDoesNotHonorPermissionContract()
    }

    @test()
    protected static async canGetLastDoesHonorOptions() {
        const expected = {
            contractId: this.contractId,
            target: {
                locationId: generateId(),
                organizationId: generateId(),
            },
        }
        this.fakePermissions([
            { id: this.generateRandomPermissionId(), can: true },
        ])
        await this.instance.doesHonorPermissionContract(expected)
        const actual = this.instance.getLastDoesHonorContractOptions()

        assert.isEqualDeep(actual, expected)
    }

    private static async assertDoesHonorPermissionContract() {
        const actual = await this.doesHonorPermissionContract()
        assert.isTrue(
            actual,
            'Expected doesHonorPermissionContract to return true'
        )
    }

    private static async assertDoesNotHonorPermissionContract() {
        const actual = await this.doesHonorPermissionContract()
        assert.isFalse(
            actual,
            'Expected doesHonorPermissionContract to return false'
        )
    }

    private static doesHonorPermissionContract(
        options?: AuthorizerDoesHonorOptions<PermissionContractId>
    ) {
        return this.instance.doesHonorPermissionContract({
            contractId: this.contractId,
            ...options,
        })
    }

    private static async assertSpysOnOptionsWhenSaving<
        ContractId extends PermissionContractId,
        Ids extends PermissionId<ContractId>,
    >(options: SavePermissionsOptions<ContractId, Ids>) {
        await this.auth.savePermissions(options)
        assert.isEqualDeep(this.auth.getLastSavePermissionsOptions(), options)
    }

    private static async assertPermNotFound(checkIds: string[], id: string) {
        await assert.doesThrowAsync(() => this.can(checkIds), id)
    }

    private static changeContractId() {
        this.contractId = generateId() as PermissionContractId
    }

    private static async assertThrowsFakeError() {
        await assert.doesThrowAsync(
            () => this.can(['test']),
            `Contract with the id '${this.contractId}'`
        )
    }

    public static fakePermissions<
        ContractId extends PermissionContractId = PermissionContractId,
    >(
        options: FakePermissionOptions<ContractId>['permissions'],
        target?: PermissionContractTarget
    ) {
        this.instance.fakePermissions({
            target,
            contractId: this.contractId as any,
            permissions: options,
        })
    }

    private static can(
        permissionIds: string[],
        target?: PermissionContractTarget
    ) {
        return this.instance.can({
            target,
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

    private static get auth() {
        return this.permissions.getAuthorizer()
    }
}
