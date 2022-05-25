import { Locale } from '@sprucelabs/heartwood-view-controllers'
import { assertOptions } from '@sprucelabs/schema'

export default class SpyLocale implements Locale {
	private static instance?: SpyLocale
	public offsetMinutes = 0
	public static getInstance() {
		if (!this.instance) {
			this.instance = new this()
		}
		return this.instance
	}

	public static reset() {
		this.instance = undefined
	}

	public setTimezoneOffsetMinutes(offsetMinutes: number): void {
		assertOptions({ offsetMinutes }, ['offsetMinutes'])
		this.offsetMinutes = offsetMinutes
	}
	public getTimezoneOffsetMinutes(): number {
		return this.offsetMinutes
	}
}
