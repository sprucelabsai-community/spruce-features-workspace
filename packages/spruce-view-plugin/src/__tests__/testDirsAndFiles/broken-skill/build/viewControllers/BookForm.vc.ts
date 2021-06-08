import dotenv from 'dotenv'
import { AbstractViewController } from '@sprucelabs/heartwood-view-controllers'

export default class BookFormViewController extends AbstractViewController<any> {
	// public static id = 'book-form'

	//@ts-ignore
	public render() {
		//@ts-ignore
		console.log = dotenv

		//@ts-ignore
		global.document = {
			//@ts-ignore
			__hack: true,
		}

		//@ts-ignore
		global.window = {
			//@ts-ignore
			__hack: true,
		}

		return {
			msg: 'what the?',
			//@ts-ignore
			globalHack2Value: global.__hack2,
		} as any
	}
}
