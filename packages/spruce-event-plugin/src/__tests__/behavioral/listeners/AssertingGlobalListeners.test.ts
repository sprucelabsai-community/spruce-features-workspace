import {
	EventFeatureListener,
	eventNameUtil,
} from '@sprucelabs/spruce-event-utils'
import { fake } from '@sprucelabs/spruce-test-fixtures'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import { EventFeaturePlugin } from '../../../plugins/event.plugin'
import listenerAssert from '../../../tests/listenerAssert'
import AbstractListenerTest from './AbstractListenersTest'

@fake.login()
export default class AssertingGlobalListenersTest extends AbstractListenerTest {
	private static event: SpyEventFeaturePlugin
	protected static async beforeEach() {
		await super.beforeEach()
		await this.bootSkillNamed('registered-skill')

		this.event = this.skill.getFeatureByCode('event') as SpyEventFeaturePlugin
		this.event.listeners = []
	}

	@test()
	protected static async canCreateAssertingGlobalListeners() {
		this.addGlobalListenerAndAssertGlobal()
		this.assertListenerNotfound(generateId())
	}

	@test()
	protected static async knowsIfNotGlobalListener() {
		const fqen = this.addListener(false)
		this.assertGlobalNotSet(fqen)
	}

	@test()
	protected static async throwsExpectedIfNoListeners() {
		this.addListener(false)
		this.addGlobalListenerAndAssertGlobal()
	}

	@test()
	protected static async canTellNamespacesApart() {
		const e1 = {
			eventName: 'event-1',
			eventNamespace: generateId(),
			version: 'v2020_10_10',
		}
		const e2 = {
			eventName: 'event-1',
			eventNamespace: generateId(),
			version: 'v2020_10_10',
		}

		this.addListener(false, e1)
		this.addListener(true, e2)

		this.assertGlobalListenerFound(eventNameUtil.join(e2))
		this.assertGlobalNotSet(eventNameUtil.join(e1))
	}

	@test()
	protected static async canTellVersionApart() {
		const e1 = {
			eventName: 'event-1',
			eventNamespace: 'test-skill',
			version: 'v2020_10_10',
		}
		const e2 = {
			eventName: 'event-1',
			eventNamespace: 'test-skill',
			version: 'v2020_10_11',
		}

		this.addListener(false, e1)
		this.addListener(true, e2)

		this.assertGlobalListenerFound(eventNameUtil.join(e2))
		this.assertGlobalNotSet(eventNameUtil.join(e1))
	}

	private static assertGlobalNotSet(fqen: string) {
		this.assertThrowsWithMessage(fqen, 'export const isGlobal = true')
	}

	private static addGlobalListenerAndAssertGlobal() {
		const fqen = this.addListener(true)
		this.assertGlobalListenerFound(fqen)
	}

	// eslint-disable-next-line no-undef
	private static addListener(
		isGlobal: boolean,
		eventParts?: {
			eventName: string
			eventNamespace: string
			version: string
		}
	) {
		const parts = eventParts ?? {
			eventName: generateId(),
			eventNamespace: generateId(),
			version: generateId(),
		}

		const fqen = eventNameUtil.join(parts)

		this.event.listeners.push({
			callback: async () => {},
			...parts,
			isGlobal,
		})
		return fqen
	}

	private static assertGlobalListenerFound(fqen: string) {
		listenerAssert.skillRegistersGlobalListener(this.skill, fqen as any)
	}

	private static assertListenerNotfound(eventName: string) {
		this.assertThrowsWithMessage(eventName, 'could not find')
	}

	private static assertThrowsWithMessage(eventName: string, msg: string) {
		assert.doesThrow(
			() =>
				listenerAssert.skillRegistersGlobalListener(
					this.skill,
					eventName as any
				),
			msg
		)
	}
}

//@ts-ignore
export interface SpyEventFeaturePlugin extends EventFeaturePlugin {
	listeners: EventFeatureListener[]
}
