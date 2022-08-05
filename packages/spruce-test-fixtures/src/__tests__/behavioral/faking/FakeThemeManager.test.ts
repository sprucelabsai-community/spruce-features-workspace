import { SpruceSchemas } from '@sprucelabs/mercury-types'
import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { generateId } from '@sprucelabs/test-utils'
import FakeThemeManager from '../../support/FakeThemeManager'

export default class FakeThemeManagerTest extends AbstractSpruceTest {
	private static manager: FakeThemeManager

	protected static async beforeEach() {
		await super.beforeEach()
		this.manager = new FakeThemeManager()
	}

	@test()
	protected static async comesWithThemeByDefault() {
		this.assertThemeEquals({
			name: 'Heartwood',
			props: {
				color1: '#ffffff',
				color1Inverse: '#0f4c8a',
				color1InverseGradient: 'linear-gradient(to left, #24c6dc, #514a9d)',
				color2: '#757575',
				color2Transparent: 'rgba(0,0,0,0.2)',
				color2Inverse: 'white',
				color2InverseTransparent: 'rgba(255,255,255,0.9)',
				color3: '#303030',
				color3Inverse: 'transparent',
				color3Compliment: '#a7a7a7',
				color4: '#626262',
				color4Compliment: 'white',
				color4ComplimentTransparent: 'rgba(0,0,0,0.1)',
				color4Inverse: 'white',
				color4InverseCompliment: '#c7c7c7',
				controlBarColor1: 'black',
				controlBarColor2: 'white',
				toolBeltColor2: '#f1f1f1',
				errorColor1: '#fff',
				errorColor1Inverse: '#FF3326',
				warningColor1: '#A16B14',
				warningColor1Inverse: '#F7D352',
			},
		})
	}

	@test()
	protected static async canSetTheme() {
		const set = {
			name: generateId(),
			props: {
				//@ts-ignore
				[generateId]: generateId(),
			},
		}

		this.manager.setTheme(set)
		this.assertThemeEquals(set)
	}

	private static assertThemeEquals(
		expected: SpruceSchemas.HeartwoodViewControllers.v2021_02_11.Theme
	) {
		assert.isEqualDeep(this.manager.getTheme(), expected)
	}
}
