import dotenv from 'dotenv'
dotenv.config()

export const DEMO_NUMBER = process.env.DEMO_NUMBER ?? '**MISSING**'
export const DEMO_NUMBER_HIRING =
	process.env.DEMO_NUMBER_HIRING ?? '**MISSING**'
export const DEMO_NUMBER_INSTALLING_SKILLS =
	process.env.DEMO_NUMBER_INSTALLING_SKILLS ?? '**MISSING**'
export const DEMO_NUMBER_SECOND_LOGIN =
	process.env.DEMO_NUMBER_SECOND_LOGIN ?? '**MISSING**'
export const DEMO_NUMBER_VIEW_FIXTURE =
	process.env.DEMO_NUMBER_VIEW_FIXTURE ?? '**MISSING**'
export const DEMO_NUMBER_MERCURY_FIXTURE =
	process.env.DEMO_NUMBER_MERCURY_FIXTURE ?? '**MISSING**'
