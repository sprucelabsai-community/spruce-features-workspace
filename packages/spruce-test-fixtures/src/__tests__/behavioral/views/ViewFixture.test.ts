import {
    AbstractSkillViewController,
    AbstractViewController,
    ActiveRecordListViewController,
    AuthenticatorImpl,
    Card,
    Device,
    formAssert,
    ScopeFlag,
    SkillViewControllerLoadOptions,
    SpruceSchemas,
    SwipeViewControllerImpl,
    vcAssert,
    ViewControllerFactory,
    ViewControllerId,
    ViewControllerPlugin,
} from '@sprucelabs/heartwood-view-controllers'
import { formatPhoneNumber } from '@sprucelabs/schema'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert, test } from '@sprucelabs/test-utils'
import { errorAssert, generateId } from '@sprucelabs/test-utils'
import { ClientProxyDecorator, seed } from '../../..'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import {
    DEMO_NUMBER_VIEW_FIXTURE,
    DEMO_NUMBER,
    DEMO_NUMBER_VIEW_FIXTURE_2,
    DEMO_NUMBER_VIEW_FIXTURE_CLIENT_2,
} from '../../../tests/constants'
import fake from '../../../tests/decorators/fake'
import FakeSkillViewController from '../../../tests/Fake.svc'
import SpyScope from '../../../tests/fixtures/SpyScope'
import ViewFixture from '../../../tests/fixtures/ViewFixture'
import SpyViewControllerFactory from '../../../tests/SpyViewControllerFactory'
import EventFaker from '../../support/EventFaker'
import FakeThemeManager from '../../support/FakeThemeManager'

const DEMO_NUMBER_FORMATTED = formatPhoneNumber(DEMO_NUMBER ?? '')

@fake.login(DEMO_NUMBER_FORMATTED)
export default class ViewFixtureTest extends AbstractSpruceFixtureTest {
    private static fixture: ViewFixture
    private static fixtureNoOptions: ViewFixture
    private static eventFaker: EventFaker
    private static lastDevice?: Device

    protected static async beforeEach() {
        await super.beforeEach()

        this.fixture = this.ViewFixture()

        this.fixtureNoOptions = this.Fixture('view')
        this.eventFaker = new EventFaker()

        await this.eventFaker.fakeRegisterSkill()
        await this.eventFaker.fakeUnregisterSkill()
        await this.eventFaker.fakeRegisterProxyToken()
    }

    @test()
    protected static async canLogin() {
        const auth = AuthenticatorImpl.getInstance()
        assert.isEqualDeep(auth.getPerson(), this.fakedPerson)

        const { person } = await this.fixtureNoOptions.loginAsDemoPerson(
            DEMO_NUMBER_VIEW_FIXTURE
        )

        const loggedIn = auth.getPerson()

        assert.isTruthy(loggedIn)
        assert.isEqualDeep(loggedIn, person)
    }

    @test()
    protected static async loginFallsBackToDemoNumber() {
        const { person } = await this.fixtureNoOptions.loginAsDemoPerson()

        assert.isEqual(person.phone, DEMO_NUMBER_FORMATTED)
    }

    @test()
    protected static async canSetHeartwoodRoot() {
        const fixture = this.Fixture('view', {
            controllerMap: {
                'heartwood.root': true,
            },
        })

        const factory = fixture.getFactory()

        //@ts-ignore
        assert.isTrue(factory.controllerMap['heartwood.root'])
    }

    @test()
    protected static fixturesShouldShareConnectToApiReferences() {
        const fixture1 = this.fixtureNoOptions
        const fixture2 = this.fixtureNoOptions

        //@ts-ignore
        assert.isEqual(fixture1.connectToApi, fixture2.connectToApi)
    }

    @test()
    protected static canPassThroughPersonFixture() {
        const personFixture = this.Fixture('person')
        const viewFixture = this.Fixture('view', { people: personFixture })

        //@ts-ignore
        assert.isEqual(viewFixture.people, personFixture)
    }

    @test()
    protected static async feedsInScope() {
        const { vc, fixture } = this.Scope()

        assert.isNull(vc.loadOptions)

        await fixture.load(vc, {})

        assert.isTruthy(vc.loadOptions)
        assert.isTruthy(vc.loadOptions.scope)
    }

    @test()
    protected static async scopeCanGetAndSetOrganization() {
        const { vc, fixture } = this.Scope()

        await fixture.loginAsDemoPerson(DEMO_NUMBER_VIEW_FIXTURE)

        await fixture.load(vc)

        const scope = vc.loadOptions?.scope

        assert.isTruthy(scope)

        let org = await scope.getCurrentOrganization()
        assert.isNull(org)

        const created = await this.organizations.seedDemoOrganization({
            name: 'Scope org',
            phone: DEMO_NUMBER_VIEW_FIXTURE,
        })

        scope.setCurrentOrganization(created.id)

        org = await scope.getCurrentOrganization()

        assert.isEqualDeep(org, created)
    }

    @test()
    protected static async scopeGetsLastOrgByDefault() {
        const orgs = this.organizations
        await orgs.seedDemoOrganization({
            name: 'Scope org',
            phone: DEMO_NUMBER_VIEW_FIXTURE,
        })

        await orgs.seedDemoOrganization({
            name: 'Scope org',
            phone: DEMO_NUMBER_VIEW_FIXTURE,
        })

        const expected = await orgs.seedDemoOrganization({
            name: 'Scope org',
            phone: DEMO_NUMBER_VIEW_FIXTURE,
        })

        const viewFixture = this.fixtureNoOptions
        await viewFixture.loginAsDemoPerson(DEMO_NUMBER_VIEW_FIXTURE)

        const current = await viewFixture.getScope().getCurrentOrganization()

        assert.isEqualDeep(current, expected)
    }

    @test()
    protected static async scopeGetsLastLocationByDefault() {
        const org = await this.organizations.seedDemoOrganization({
            name: 'Scope org',
            phone: DEMO_NUMBER_VIEW_FIXTURE,
        })

        await this.locations.seedDemoLocation({
            organizationId: org.id,
            phone: DEMO_NUMBER_VIEW_FIXTURE,
        })

        await this.locations.seedDemoLocation({
            organizationId: org.id,
            phone: DEMO_NUMBER_VIEW_FIXTURE,
        })

        await this.locations.seedDemoLocation({
            organizationId: org.id,
            phone: DEMO_NUMBER_VIEW_FIXTURE,
        })

        const viewFixture = this.fixtureNoOptions

        await viewFixture.loginAsDemoPerson(DEMO_NUMBER_VIEW_FIXTURE)

        const current = await viewFixture.getScope().getCurrentLocation()

        const { client } = await this.fixture.loginAsDemoPerson(
            DEMO_NUMBER_VIEW_FIXTURE
        )

        const [{ locations }] = await client.emitAndFlattenResponses(
            'list-locations::v2020_12_25',
            {
                target: {
                    organizationId: org.id,
                },
            }
        )

        const expected = locations[0]

        assert.isEqualDeep(current, expected)
    }

    @test()
    protected static async scopeCanGetAndSetLocation() {
        await this.fixture.loginAsDemoPerson(DEMO_NUMBER_VIEW_FIXTURE)

        const { vc, fixture } = this.Scope()

        await fixture.load(vc)

        const scope = vc.loadOptions?.scope

        assert.isTruthy(scope)

        let location = await scope.getCurrentLocation()
        assert.isNull(location)

        const created = await this.Fixture('location').seedDemoLocation({
            name: 'Scope org',
            phone: DEMO_NUMBER_VIEW_FIXTURE,
        })

        scope.setCurrentLocation(created.id)

        location = await scope.getCurrentLocation()

        assert.isEqualDeep(location, created)
    }

    @test()
    protected static async sharesPersonFixture() {
        const { fixture } = this.Scope()
        assert.isEqual(
            //@ts-ignore
            fixture.people,
            //@ts-ignore
            fixture.orgs.people
        )

        assert.isEqual(
            //@ts-ignore
            fixture.people,
            //@ts-ignore
            fixture.locations.people
        )

        assert.isEqual(
            //@ts-ignore
            fixture.orgs,
            //@ts-ignore
            fixture.locations.orgs
        )
    }

    @test()
    protected static async canSetScopeForCurrentOrganizationAcrossViewFixtures() {
        const org = await this.organizations.seedDemoOrganization({
            phone: DEMO_NUMBER_VIEW_FIXTURE,
            name: 'My new org!',
        })

        this.fixtureNoOptions.getScope().setCurrentOrganization(org.id)

        const { vc, fixture } = this.Scope()

        await fixture.load(vc)

        const current = await vc.loadOptions?.scope.getCurrentOrganization()

        assert.isEqualDeep(current, org)
    }

    @test()
    protected static async scopeShouldBeResetEachRun() {
        const { vc, fixture } = this.Scope()

        await fixture.loginAsDemoPerson(DEMO_NUMBER_VIEW_FIXTURE)

        await fixture.load(vc)

        const current = await vc.loadOptions?.scope.getCurrentOrganization()

        assert.isNull(current)
    }

    @test()
    protected static fixturesShareVcFactory() {
        const options = {
            controllerMap: {
                'heartwood.root': true,
            },
        }

        const fixture1 = this.Fixture('view', options)
        const fixture2 = this.Fixture('view', options)

        assert.isEqual(fixture1.getFactory(), fixture2.getFactory())
    }

    @test()
    protected static async mixesInControllerMapWithLocalViews() {
        await this.bootAndRegisterSkillFromTestDir('skill')

        const fixture = this.Fixture('view', {
            controllerMap: {
                'new.view': FakeSkillViewController,
            },
        })

        const factory = fixture.getFactory()

        //@ts-ignore
        factory.Controller('views.book', {})

        //@ts-ignore
        factory.Controller('new.view', {})
    }

    @test()
    protected static fixturesContinueToMixinViewControllers() {
        this.Fixture('view', {
            controllerMap: {
                'new.view': FakeSkillViewController,
            },
        }).getFactory()

        const fixture = this.Fixture('view', {
            controllerMap: {
                'new.view2': FakeSkillViewController,
            },
        })

        //@ts-ignore
        fixture.getFactory().Controller('new.view2')
    }

    @test()
    protected static fixtureAttachesRenderCount() {
        const vc = this.MockVc()

        vcAssert.assertTriggerRenderCount(vc, 0)

        vc.triggerRender()

        vcAssert.assertTriggerRenderCount(vc, 1)
    }

    @test()
    protected static async fixturePatchesAlertToThrow() {
        const vc = this.MockVc()
        //@ts-ignore
        assert.isFunction(vc._originalAlert)
        //@ts-ignore
        await assert.doesThrowAsync(() => vc.alert())
    }

    @test()
    protected static fixturePatchesRenderInDialogToThrow() {
        const vc = this.MockVc()
        //@ts-ignore
        assert.isFunction(vc._originalRenderInDialog)
        //@ts-ignore
        assert.doesThrow(() => vc.renderInDialog({}))
    }

    @test()
    protected static async testRouterThrowsOnRedirect() {
        const router = this.fixture.getRouter()
        await assert.doesThrowAsync(() => router.redirect('heartwood.root'))

        await vcAssert.assertActionRedirects({
            action: () => router.redirect('heartwood.root'),
            router,
        })
    }

    @test()
    protected static canGetAuthenticatorInstance() {
        const viewFixture = this.Fixture('view', {
            controllerMap: {
                card: FakeSkillViewController,
            },
        })

        assert.isFunction(viewFixture.getAuthenticator)
        assert.isEqual(
            viewFixture.getAuthenticator(),
            AuthenticatorImpl.getInstance()
        )
    }

    @test()
    protected static activeRecordThrowsByDefault() {
        //@ts-ignore
        assert.isTrue(ActiveRecordListViewController.shouldThrowOnResponseError)
        ActiveRecordListViewController.setShouldThrowOnResponseError(false)
    }

    @test()
    protected static activeRecordThrowReset() {
        //@ts-ignore
        assert.isTrue(ActiveRecordListViewController.shouldThrowOnResponseError)
    }

    @test()
    protected static async loggingInWithViewFixtureSetsProxyTokenForSkill() {
        const { client, token, generator } = await this.loginAndGetProxy()

        assert.isTruthy(token)
        assert.isTruthy(client.getProxyToken())
        assert.isEqual(token, client.getProxyToken())

        const token2 = await generator?.()

        assert.isEqual(token, token2)

        const results = await client.emit('whoami::v2020_12_25')

        eventResponseUtil.getFirstResponseOrThrow(results)
    }

    @test()
    protected static async proxyGeneratorIsResetWhenDifferentPersonLogsIn() {
        const { token } = await this.loginAndGetProxy()
        const { token: token2 } = await this.loginAndGetProxy(
            DEMO_NUMBER_VIEW_FIXTURE_2
        )

        assert.isNotEqual(token, token2)
    }

    @test()
    protected static async sameProxyAcrossFixturesWithSameNumber() {
        const { token } = await this.loginAndGetProxy()
        const { token: token2 } = await this.loginAndGetProxy()

        assert.isEqual(token, token2)
    }

    @test()
    protected static async generatorResetEachTest() {
        //@ts-ignore
        assert.isEqualDeep(ViewFixture.loggedInPersonProxyTokens, {})
        const generator = this.getProxyGenerator()
        assert.isFalsy(generator)
    }

    @test()
    protected static async loggingInAsViewSetsClientForViewControllers() {
        const client = await this.loginAsDemoPerson()
        const vc = this.fixture.Controller('client', {})
        const client2 = await vc.connect()

        assert.isEqual(client, client2)
    }

    @test()
    protected static viewClientIsResetAfterEachTest() {
        //@ts-ignore
        assert.isFalsy(ViewFixture.viewClient)
    }

    @test()
    protected static async generatorIsNotVulnerableToRaceConditions() {
        const client = await this.loginAsDemoPerson()

        const generator = this.fixture.getProxyTokenGenerator()

        assert.isTruthy(generator)

        let hitCount = 0
        await client.on('register-proxy-token::v2020_12_25', () => {
            hitCount++
            return {
                token: 'aoeu',
            }
        })

        await Promise.all([
            generator(),
            generator(),
            generator(),
            generator(),
            generator(),
            generator(),
            generator(),
            generator(),
            generator(),
        ])

        assert.isEqual(hitCount, 1)
    }

    @test()
    protected static async patchesConfirmToThrow() {
        const vc = this.MockVc()
        //@ts-ignore
        await assert.doesThrowAsync(() => vc.confirm())
    }

    @test()
    protected static async setsSwipeVcJumpToSlideDuration() {
        assert.isEqual(SwipeViewControllerImpl.swipeDelay, 0)
        SwipeViewControllerImpl.swipeDelay = 100
        await ViewFixture.beforeEach()
        assert.isEqual(SwipeViewControllerImpl.swipeDelay, 0)
    }

    @test()
    protected static canSetScope() {
        const scope = new SpyScope({
            organizationFixture: this.organizations,
            locationFixture: this.locations,
        })

        this.fixture.setScope(scope)
        assert.isEqual(this.fixture.getScope(), scope)
    }

    @test()
    protected static async loadingAScopedToOrgVcWithoutASeededOrgThrows() {
        const vc = this.ScopedByOrgVc()

        const err = await assert.doesThrowAsync(() => this.fixture.load(vc))
        errorAssert.assertError(err, 'SCOPE_REQUIREMENTS_NOT_MET')
    }

    @test()
    protected static async loadingAScopedToLocationVcWithoutASeededLocationThrows() {
        const vc = this.ScopedByLocationVc()
        const err = await assert.doesThrowAsync(() => this.fixture.load(vc))
        errorAssert.assertError(err, 'SCOPE_REQUIREMENTS_NOT_MET')
    }

    @test()
    @seed('organizations', 1)
    protected static async loadingWithOrgScopeAndSeededOrg() {
        const vc = this.ScopedByOrgVc()
        await this.fixture.load(vc)

        vc.getScope = () => ['employed', 'organization']
        await this.fixture.load(vc)
    }

    @test()
    @seed('locations', 1)
    protected static async loadingWithLocationScopeAndSeededLocation() {
        const vc = this.ScopedByLocationVc()
        await this.fixture.load(vc)

        vc.getScope = () => ['employed', 'location']
        await this.fixture.load(vc)
    }

    @test()
    protected static async setsFactoryToFormAssert() {
        this.fixture.getFactory()
        //@ts-ignore
        assert.isEqual(formAssert.views, this.fixture.getFactory())
    }

    @test()
    protected static async canSetMercuryClient() {
        const client = await this.mercury.connectToApi({
            shouldReUseClient: false,
        })
        this.fixture.setClient(client)
        //@ts-ignore
        assert.isEqual(ViewFixture.viewClient, client)
    }

    @test()
    protected static async loadOptionsComeWithFakeThemeManager() {
        const options = this.buildLoadOptions()
        assert.isTrue(options.themes instanceof FakeThemeManager)
    }

    @test()
    protected static async sameFakeThemeEachTime() {
        const options1 = this.buildLoadOptions()
        const options2 = this.buildLoadOptions()

        assert.isEqual(options1.themes, options2.themes)
    }

    @test()
    protected static async sameThemesOnFixture() {
        assert.isEqual(this.fixture.getThemes(), this.buildLoadOptions().themes)
    }

    @test()
    protected static async canSetController() {
        const factory = this.fixture.getFactory()
        const name: any = generateId()
        const Vc: any = {}

        let passedName: string | undefined
        let passedVc: any | undefined

        factory.setController = (name, Vc: any) => {
            passedName = name
            passedVc = Vc
        }

        this.fixture.setController(name, Vc)
        assert.isEqual(passedName, name)
        assert.isEqual(passedVc, Vc)
    }

    @test()
    protected static async deviceIsSetOnFixtureAndFactory() {
        const factory = this.fixture.getFactory()
        const device = this.fixture.getDevice()
        //@ts-ignore
        assert.isEqual(factory.device, device)

        const factory2 = this.ViewFixture()
        assert.isEqual(factory2.getDevice(), device)
        this.lastDevice = device
    }

    @test()
    protected static async newDeviceBeforeEach() {
        const device = this.fixture.getDevice()
        assert.isNotEqual(device, this.lastDevice)
    }

    @test()
    protected static async mutesLogs() {
        console.log = () => assert.fail('should not be called')
        console.warn = () => assert.fail('should not be called')
        console.error = () => assert.fail('should not be called')

        const vc = this.MockVc('logging') as LoggingViewController
        const log = vc.getLog()

        log.info('hey')
        log.error('hey')
        log.warn('hey')
    }

    @test()
    protected static async buildVcPluginExposedInFixture() {
        const factory = this.fixture.getFactory()

        let wasHit = false
        let PassedClass: any | undefined
        let response = {}

        //@ts-ignore
        factory.BuildPlugin = (Class) => {
            wasHit = true
            PassedClass = Class
            return response
        }

        const plugin = this.fixture.BuildPlugin(SpyVcPlugin)

        assert.isTrue(wasHit)
        assert.isEqual(PassedClass, SpyVcPlugin)
        assert.isEqual(plugin, response)
    }

    @test()
    protected static async addPluginExposedInFixure() {
        const factory = this.fixture.getFactory()

        const name = generateId()

        let passedName: string | undefined
        let passedPlugin: ViewControllerPlugin | undefined

        const plugin = this.fixture.BuildPlugin(SpyVcPlugin)
        factory.addPlugin = (named, plugin) => {
            passedName = named
            passedPlugin = plugin
        }

        this.fixture.addPlugin(name, plugin)

        assert.isEqual(passedName, name)
        assert.isEqual(passedPlugin, plugin)
    }

    @test()
    protected static async getFactoryReturnsSpyFactory() {
        this.assertSpyFactoryUsed()
    }

    @test()
    protected static async spyFactoryResetForEachTest() {
        delete ViewControllerFactory.Class
    }

    @test()
    protected static async getFactoryReturnsSpyFactoryForNextTest() {
        this.assertSpyFactoryUsed()
    }

    private static assertSpyFactoryUsed() {
        assert.isInstanceOf(this.fixture.getFactory(), SpyViewControllerFactory)
    }

    private static ViewFixture(): ViewFixture {
        return this.Fixture('view', {
            controllerMap: {
                scope: ScopeSvc,
                client: ClientSvc,
                scopedByOrg: ScopedByOrgSvc,
                scopedByLocation: ScopedByLocationSvc,
            },
        })
    }

    private static buildLoadOptions() {
        return this.router.buildLoadOptions()
    }

    private static ScopedByOrgVc() {
        return this.fixture.Controller(
            'scopedByOrg' as any,
            {}
        ) as ScopedByOrgSvc
    }

    private static ScopedByLocationVc() {
        return this.fixture.Controller(
            'scopedByLocation' as any,
            {}
        ) as ScopedByLocationSvc
    }

    protected static async loginAsDemoPerson() {
        const { client } = await this.fixture.loginAsDemoPerson(
            DEMO_NUMBER_VIEW_FIXTURE_CLIENT_2
        )

        return client
    }

    private static async loginAndGetProxy(phone?: string) {
        const { client } = await this.fixtureNoOptions.loginAsDemoPerson(
            phone ?? DEMO_NUMBER_VIEW_FIXTURE
        )

        const generator = this.getProxyGenerator()

        const token = await generator?.()

        return { client, token, generator }
    }

    private static getProxyGenerator() {
        const decorator = ClientProxyDecorator.getInstance()
        const generator = decorator.getProxyTokenGenerator()
        return generator
    }

    private static Scope() {
        const factory = this.fixture.getFactory()
        const vc = factory.Controller('scope', {})

        return { vc, fixture: this.fixture }
    }

    private static MockVc(named: ViewControllerId = 'card') {
        const viewFixture = this.Fixture('view', {
            controllerMap: {
                card: FakeSkillViewController,
                logging: LoggingViewController,
            },
        })
        const factory = viewFixture.getFactory()

        const vc = factory.Controller(named, {
            header: { title: 'hey' },
        })
        return vc
    }

    private static get router() {
        return this.fixture.getRouter()
    }
}

declare module '@sprucelabs/heartwood-view-controllers/build/types/heartwood.types' {
    interface ViewControllerMap {
        scope: ScopeSvc
        client: ClientSvc
        logging: LoggingViewController
    }
}

interface Args {
    hello?: string
    world?: number
}

class LoggingViewController extends AbstractViewController<Card> {
    public getLog() {
        return this.log
    }
    public render(): SpruceSchemas.HeartwoodViewControllers.v2021_02_11.Card {
        return {}
    }
}

class ScopeSvc extends AbstractSkillViewController<Args> {
    public loadOptions: SkillViewControllerLoadOptions | null = null

    public async load(options: SkillViewControllerLoadOptions<Args>) {
        this.loadOptions = options
    }

    public render() {
        return {
            layouts: [],
        }
    }
}

class ScopedByOrgSvc extends AbstractSkillViewController {
    public getScope = () => ['organization'] as ScopeFlag[]

    public render(): SpruceSchemas.HeartwoodViewControllers.v2021_02_11.SkillView {
        return {
            layouts: [],
        }
    }
}

class ScopedByLocationSvc extends AbstractSkillViewController {
    public getScope = () => ['location'] as ScopeFlag[]

    public render(): SpruceSchemas.HeartwoodViewControllers.v2021_02_11.SkillView {
        return {
            layouts: [],
        }
    }
}

class ClientSvc extends AbstractSkillViewController {
    public loadOptions: SkillViewControllerLoadOptions | null = null

    public connect() {
        return this.connectToApi()
    }

    public render() {
        return {
            layouts: [],
        }
    }
}

class SpyVcPlugin implements ViewControllerPlugin {}
