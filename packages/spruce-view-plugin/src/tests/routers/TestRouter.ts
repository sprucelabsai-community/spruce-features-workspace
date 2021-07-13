import {
	Authenticator,
	Router,
	SkillViewController,
	SkillViewControllerArgs,
	SkillViewControllerId,
	SkillViewControllerMap,
	ViewControllerFactory,
} from '@sprucelabs/heartwood-view-controllers'
import SpruceError from '../../errors/SpruceError'

export class TestRouter implements Router {
	private vcFactory: ViewControllerFactory
	private presentVc?: SkillViewController<any>

	public constructor(vcFactory: ViewControllerFactory) {
		this.vcFactory = vcFactory
	}

	public getPresentVc() {
		return this.presentVc
	}

	public async redirect<Id extends SkillViewControllerId>(
		id: Id,
		args?: SkillViewControllerArgs<Id>
	): Promise<SkillViewControllerMap[Id]> {
		if (!this.vcFactory.hasController(id)) {
			throw new SpruceError({
				code: 'INVALID_VIEW_CONTROLLER',
				name: 'waka.waka',
			})
		}

		//@ts-ignore
		this.presentVc = this.vcFactory.Controller(id, {})

		await this.presentVc.load(this.buildLoadOptions(args))

		return this.presentVc as any
	}

	public async back() {
		return this.presentVc
	}

	public buildLoadOptions(args: any = {}) {
		return {
			router: this as TestRouter,
			authenticator: Authenticator.getInstance(),
			args,
		}
	}
}
