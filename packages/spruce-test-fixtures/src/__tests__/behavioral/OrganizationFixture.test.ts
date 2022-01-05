import { eventAssertUtil } from '@sprucelabs/spruce-event-utils'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import {
	DEMO_NUMBER_HIRING,
	DEMO_NUMBER_INSTALLING_SKILLS,
	DEMO_NUMBER_ORGANIZATION_FIXTURE,
} from '../../tests/constants'

export default class OrganizationFixtureTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async canCreateOrganizationFixture() {
		assert.isTruthy(this.organizations)
	}

	@test()
	protected static async canSeedOrg() {
		const org = await this.organizations.seedDemoOrganization({
			name: 'my org',
		})
		assert.isTruthy(org)
		assert.isEqual(org.name, 'my org')
	}

	@test()
	protected static async orgFixtureDestroysOrgs() {
		const org = await this.organizations.seedDemoOrganization({
			name: 'my org',
		})
		await this.organizations.destroy()
		await this.organizations.destroy()

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
		const org = await this.organizations.seedDemoOrganization({
			name: 'my org',
			phone: DEMO_NUMBER_ORGANIZATION_FIXTURE,
		})

		const { person } = await this.people.loginAsDemoPerson(DEMO_NUMBER_HIRING)

		const isHired = await this.organizations.isPartOfOrg({
			personId: person.id,
			organizationId: org.id,
			phone: DEMO_NUMBER_ORGANIZATION_FIXTURE,
		})
		assert.isFalse(isHired)
	}

	@test('can add as guest', 'guest')
	@test('can add as teammate', 'teammate')
	protected static async canAddPersonToOrg(base: string) {
		const { person, org } = await this.seedOrgAndHirePerson(base)

		const isHired = await this.isPersonPartOfOrg(person.id, org.id)
		assert.isTrue(isHired)

		const roles = await this.roles.listRoles({
			organizationId: org.id,
			personId: person.id,
			phone: DEMO_NUMBER_HIRING,
		})

		assert.isLength(roles, 1)
		assert.isEqual(roles[0].base, base as any)
	}

	private static async isPersonPartOfOrg(personId: string, orgId: string) {
		return await this.organizations.isPartOfOrg({
			personId,
			organizationId: orgId,
		})
	}

	@test()
	protected static async isNotInstalledByDefault() {
		const { skill, org } = await this.seedOrgAndSkill()
		const isInstalled = await this.organizations.isSkillInstalled(
			skill.id,
			org.id
		)
		assert.isFalse(isInstalled)
	}

	@test()
	protected static async showsAsInstalled() {
		const { skill, org } = await this.seedOrgAndSkill()
		await this.organizations.installSkill(skill.id, org.id)
		await this.assertSkillIsInstalled(skill.id, org.id)
	}

	@test()
	protected static async cantInstallWithBadSkill() {
		const { org } = await this.seedOrgAndSkill()
		const err = await assert.doesThrowAsync(() =>
			this.organizations.installSkillsByNamespace({
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
		await this.organizations.installSkillsByNamespace({
			organizationId: org.id,
			namespaces: [skill.slug],
		})

		await this.assertSkillIsInstalled(skill.id, org.id)
	}

	@test()
	protected static async canInstallSkillFromAnotherPerson() {
		const { skill, org } = await this.seedOrgAndSkill()

		const skill2 = await this.skills.seedDemoSkill({
			name: 'testing testy 2',
			creatorPhone: DEMO_NUMBER_INSTALLING_SKILLS,
		})

		await this.organizations.installSkillsByNamespace({
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
				shouldOnlyShowMine: true,
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
		assert.isEqual(orgFixture.people, personFixture)
	}

	@test()
	protected static async canSeedOrgWithNoOptions() {
		const org = await this.Fixture('organization').seedDemoOrganization()
		assert.isTruthy(org)
	}

	@test()
	protected static async removePersonThrowsWithBadIds() {
		await assert.doesThrowAsync(() =>
			this.organizations.removePerson({
				phone: DEMO_NUMBER_HIRING,
				roleBase: 'guest',
				organizationId: 'aoeu',
				personId: 'aoeu',
			})
		)
	}

	@test('can remove guest', 'guest')
	@test('can remove teammate', 'teammate')
	protected static async canRemovePersonFromOrg(roleBase: string) {
		const { person, org } = await this.seedOrgAndHirePerson(roleBase)

		await this.organizations.removePerson({
			phone: DEMO_NUMBER_HIRING,
			roleBase,
			organizationId: org.id,
			personId: person.id,
		})

		const isHired = await this.isPersonPartOfOrg(person.id, org.id)

		assert.isFalse(isHired)
	}

	private static async seedOrgAndHirePerson(base: string) {
		const org = await this.organizations.seedDemoOrganization({
			name: 'my org',
			phone: DEMO_NUMBER_HIRING,
		})

		const { person } = await this.people.loginAsDemoPerson()

		await this.organizations.addPerson({
			personId: person.id,
			organizationId: org.id,
			roleBase: base,
			phone: DEMO_NUMBER_HIRING,
		})

		return { person, org }
	}

	private static async assertSkillIsInstalled(skillId: string, orgId: string) {
		const isInstalled = await this.organizations.isSkillInstalled(
			skillId,
			orgId
		)
		assert.isTrue(isInstalled)
	}

	private static async seedOrgAndSkill() {
		const skill = await this.skills.seedDemoSkill({
			name: 'testing testy',
		})
		const org = await this.organizations.seedDemoOrganization({
			name: 'my org',
		})
		return { skill, org }
	}
}
