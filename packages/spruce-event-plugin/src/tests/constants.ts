import dotenv from 'dotenv'
dotenv.config({ quiet: true })

export const DEMO_NUMBER_DELAYED_CONNECT =
    process.env.DEMO_NUMBER_DELAYED_CONNECT ?? '***missing***'
