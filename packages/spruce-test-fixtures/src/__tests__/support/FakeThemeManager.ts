import {
	SpruceSchemas,
	ThemeManager,
} from '@sprucelabs/heartwood-view-controllers'

type Theme = SpruceSchemas.HeartwoodViewControllers.v2021_02_11.Theme

export default class FakeThemeManager implements ThemeManager {
	private theme: Theme = {
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
	}

	public setTheme(theme: Theme): void {
		this.theme = {
			...theme,
		}
	}

	public getTheme(): SpruceSchemas.HeartwoodViewControllers.v2021_02_11.Theme {
		return this.theme
	}
}
