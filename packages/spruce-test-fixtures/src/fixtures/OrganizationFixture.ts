import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import PersonFixture from './PersonFixture'

export default class OrganizationFixture {
	private personFixture: PersonFixture

	public constructor(personFixture: PersonFixture) {
		this.personFixture = personFixture
	}

	public async seedDemoOrg(values: { name: string; slug?: string }) {
		const allValues = {
			slug: `my-org-${new Date().getTime()}`,
			...values,
		}

		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('create-organization::v2020_12_25', {
			payload: allValues,
		})

		const { organization } = eventResponseUtil.getFirstResponseOrThrow(results)

		return organization
	}

	public async destory() {
		await this.personFixture.destroy()
	}
}
