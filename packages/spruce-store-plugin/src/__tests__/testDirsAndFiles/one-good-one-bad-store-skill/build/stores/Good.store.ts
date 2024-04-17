import { AbstractStore } from '@sprucelabs/data-stores'
import { buildSchema } from '@sprucelabs/schema'

const fullSchema = buildSchema({
    id: 'goodFull',
    fields: {},
})

type FullSchema = typeof fullSchema

export default class GoodStore extends AbstractStore<FullSchema> {
    public name = 'good'
    protected collectionName = 'good_stuff'
    protected createSchema = fullSchema
    protected updateSchema = fullSchema
    protected fullSchema = fullSchema
    protected databaseSchema = fullSchema
}
