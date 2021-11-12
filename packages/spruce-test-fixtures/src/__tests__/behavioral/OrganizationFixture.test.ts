import { eventAssertUtil } from '@sprucelabs/spruce-event-utils'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import {
	DEMO_NUMBER_HIRING,
	DEMO_NUMBER_INSTALLING_SKILLS,
} from '../../tests/constants'
import OrganizationFixture from '../../tests/fixtures/OrganizationFixture'

export default class OrganizationFixtureTest extends AbstractSpruceFixtureTest {
	private static fixture: OrganizationFixture

	protected static async beforeEach() {
		await super.beforeEach()
		this.fixture = this.Fixture('organization')
	}

	@test()
	protected static async canCreateOrganizationFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async canSeedOrg() {
		const org = await this.fixture.seedDemoOrganization({ name: 'my org' })
		assert.isTruthy(org)
		assert.isEqual(org.name, 'my org')
	}

	@test()
	protected static async orgFixtureDestroysOrgs() {
		const org = await this.fixture.seedDemoOrganization({ name: 'my org' })
		await this.fixture.destory()
		await this.fixture.destory()

		const client = await this.Fixture('mercury').connectToApi()
		const results = await client.emit('get-organization::v2020_12_25', {
			target: {
				organizationId: org.id,
			},
		})

		eventAssertUtil.assertErrorFromResponse(results, 'INVALID_TARGET')
	}

	@test()
	protected static async isNotPartOfOrgtoStart() {
		const people = this.Fixture('person')
		const org = await this.fixture.seedDemoOrganization({ name: 'my org' })

		const { person } = await people.loginAsDemoPerson(DEMO_NUMBER_HIRING)

		const isHired = await this.fixture.isPartOfOrg(person.id, org.id)
		assert.isFalse(isHired)
	}

	@test()
	protected static async canAttachPersonToOrg() {
		const people = this.Fixture('person')
		const org = await this.fixture.seedDemoOrganization({ name: 'my org' })

		const { person } = await people.loginAsDemoPerson(DEMO_NUMBER_HIRING)

		await this.fixture.addPerson({
			personId: person.id,
			organizationId: org.id,
			roleBase: 'guest',
		})

		const isHired = await this.fixture.isPartOfOrg(person.id, org.id)
		assert.isTrue(isHired)
	}

	@test()
	protected static async isNotInstalledByDefault() {
		const { skill, org } = await this.seedOrgAndSkill()
		const isInstalled = await this.fixture.isSkillInstalled(skill.id, org.id)
		assert.isFalse(isInstalled)
	}

	@test()
	protected static async showsAsInstalled() {
		const { skill, org } = await this.seedOrgAndSkill()
		await this.fixture.installSkill(skill.id, org.id)
		await this.assertSkillIsInstalled(skill.id, org.id)
	}

	@test()
	protected static async cantInstallWithBadSkill() {
		const { org } = await this.seedOrgAndSkill()
		const err = await assert.doesThrowAsync(() =>
			this.fixture.installSkillsByNamespace({
				organizationId: org.id,
				namespaces: ['aoeuaoeu'],
			})
		)

		eventAssertUtil.assertError(err, 'INVALID_NAMESPACES', {
			namespaces: ['aoeuaoeu'],
		})
	}

	@test()
	protected static async canInstallWithSlug() {
		const { skill, org } = await this.seedOrgAndSkill()
		await this.fixture.installSkillsByNamespace({
			organizationId: org.id,
			namespaces: [skill.slug],
		})

		await this.assertSkillIsInstalled(skill.id, org.id)
	}

	@test()
	protected static async canInstallSkillFromAnotherPerson() {
		const { skill, org } = await this.seedOrgAndSkill()

		const skill2 = await this.Fixture('skill').seedDemoSkill({
			name: 'testing testy 2',
			creatorPhone: DEMO_NUMBER_INSTALLING_SKILLS,
		})

		await this.fixture.installSkillsByNamespace({
			organizationId: org.id,
			namespaces: [skill.slug, skill2.slug],
		})

		await this.assertSkillIsInstalled(skill.id, org.id)
		await this.assertSkillIsInstalled(skill2.id, org.id)
	}

	@test()
	protected static async canDeleteAllExistingOrgs() {
		const firstFixture = this.Fixture('organization')

		await firstFixture.seedDemoOrganization({
			name: 'org 1',
			phone: DEMO_NUMBER_INSTALLING_SKILLS,
		})

		await firstFixture.seedDemoOrganization({
			name: 'org 2',
			phone: DEMO_NUMBER_INSTALLING_SKILLS,
		})

		const secondFixture = this.Fixture('organization')

		await secondFixture.deleteAllOrganizations(DEMO_NUMBER_INSTALLING_SKILLS)

		const { client } = await this.Fixture('person').loginAsDemoPerson(
			DEMO_NUMBER_INSTALLING_SKILLS
		)

		const results = await client.emit('list-organizations::v2020_12_25', {
			payload: {
				showMineOnly: true,
			},
		})

		const { organizations } = eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isLength(organizations, 0)
	}

	@test()
	protected static async passesThroughAllFieldsToRequest() {
		await assert.doesThrowAsync(() =>
			this.Fixture('organization').seedDemoOrganization({
				//@ts-ignore
				waka: 'tacas',
			})
		)
	}

	@test()
	protected static canPassPersonFixture() {
		const personFixture = this.Fixture('person')
		const orgFixture = this.Fixture('organization', { personFixture })

		//@ts-ignore
		assert.isEqual(orgFixture.personFixture, personFixture)
	}

	private static async assertSkillIsInstalled(skillId: string, orgId: string) {
		const isInstalled = await this.fixture.isSkillInstalled(skillId, orgId)
		assert.isTrue(isInstalled)
	}

	private static async seedOrgAndSkill() {
		const skill = await this.Fixture('skill').seedDemoSkill({
			name: 'testing testy',
		})
		const org = await this.fixture.seedDemoOrganization({ name: 'my org' })
		return { skill, org }
	}
}
