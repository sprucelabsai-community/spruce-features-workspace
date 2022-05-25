import { Locale } from '@sprucelabs/heartwood-view-controllers'

export default class SpyLocale implements Locale {
	private static instance?: SpyLocale
	public offset = 0
	public static getInstance() {
		if (!this.instance) {
			this.instance = new this()
		}
		return this.instance
	}

	public static reset() {
		this.instance = undefined
	}

	public setTimezoneOffsetMinutes(offset: number): void {
		this.offset = offset
	}
	public getTimezoneOffsetMinutes(): number {
		return this.offset
	}
}
