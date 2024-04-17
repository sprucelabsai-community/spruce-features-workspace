import { AbstractStore } from '@sprucelabs/data-stores'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { buildSchema } from '@sprucelabs/schema'
import { StoreSeedOptions } from '../../../types/store.types'

const dummySchema = buildSchema({
    id: 'dummy',
    fields: {
        id: {
            type: 'id',
        },
    },
})
type DummySchema = typeof dummySchema
export class DummyStore extends AbstractStore<DummySchema> {
    public name = 'Dummy!'

    protected collectionName = 'dummies'
    protected createSchema = dummySchema
    protected updateSchema = dummySchema
    protected fullSchema = dummySchema
    protected databaseSchema = dummySchema

    public static lastFakedOwner?: SpruceSchemas.Spruce.v2020_07_22.Person

    public static seedCb?: () => Promise<void> | void
    public static wasSeedInvoked = false
    public static seedOptions = {}
    public static Store(options: any) {
        return new this(options)
    }

    public async seed(options: StoreSeedOptions) {
        DummyStore.wasSeedInvoked = true
        DummyStore.seedOptions = options
        await DummyStore.seedCb?.()
    }
}
