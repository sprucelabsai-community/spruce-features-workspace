import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const skillNotFoundSchema: SpruceErrors.SpruceTestFixtures.SkillNotFoundSchema =
    {
        id: 'skillNotFound',
        namespace: 'SpruceTestFixtures',
        name: 'Skill not found',
        fields: {
            /** . */
            slug: {
                type: 'text',
                isRequired: true,
                options: undefined,
            },
        },
    }

SchemaRegistry.getInstance().trackSchema(skillNotFoundSchema)

export default skillNotFoundSchema
