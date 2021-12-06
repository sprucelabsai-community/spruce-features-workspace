import { EventFeatureListener } from '@sprucelabs/spruce-event-utils'
import { SettingsService } from '@sprucelabs/spruce-skill-utils'

const cleanKey = (str: string) => {
	return str.replace(/\W/g, '')
}

export default class ListenerCacher {
	private cwd: string
	private _settings?: SettingsService
	private listenerCacheKey: string

	private get settingsPath() {
		return `events.listenerCacheKeys.${cleanKey(this.host)}`
	}
	private host: string

	public constructor(options: {
		cwd: string
		listeners: EventFeatureListener[]
		host: string
	}) {
		const { cwd, listeners: listenerPaths, host } = options

		this.cwd = cwd
		this.host = host
		this.listenerCacheKey = cleanKey(
			listenerPaths
				.map((m) => `${m.eventName}-${m.eventNamespace}-${m.version}`)
				.sort()
				.join('')
		)
	}

	private get settings() {
		if (!this._settings) {
			this._settings = new SettingsService(this.cwd)
		}

		return this._settings
	}

	public cacheListeners() {
		return this.settings.set(this.settingsPath, this.listenerCacheKey)
	}

	public haveListenersChanged() {
		const existingCache = this.loadCurrentCacheKey()

		return existingCache !== this.listenerCacheKey
	}

	private loadCurrentCacheKey() {
		return this.settings.get(this.settingsPath)
	}
}
