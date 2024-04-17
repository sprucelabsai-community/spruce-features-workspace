import { buildSchema } from '@sprucelabs/schema'

export default buildSchema({
    id: 'testRouterEmitPayload',
    name: 'Test Router Emit payload',
    importsWhenLocal: [
        'import * as HeartwoodViewController from "@sprucelabs/heartwood-view-controllers"',
    ],
    fields: {
        id: {
            type: 'text',
            isRequired: true,
        },
        vc: {
            type: 'raw',
            isRequired: true,
            options: {
                valueType: 'HeartwoodViewController.SkillViewController',
            },
        },
        args: {
            type: 'raw',
            options: {
                valueType: 'Record<string, any>',
            },
        },
    },
})
