import { AbstractStore, UniversalStoreOptions } from '@sprucelabs/data-stores'
import { buildSchema } from '@sprucelabs/schema'
import { StoreSeedOptions } from '../../../../..'

const fullSchema = buildSchema({
	id: 'goodFull',
	fields: {
		firstName: {
			type: 'text'
		}
	},
})

type FullSchema = typeof fullSchema

export default class GoodStore extends AbstractStore<FullSchema> {
	public name = 'good'
	protected collectionName = 'good_stuff'
	protected createSchema = fullSchema
	protected updateSchema = fullSchema
	protected fullSchema = fullSchema
	protected databaseSchema = fullSchema

	public static Store(options: UniversalStoreOptions) {
		return new this(options.db)
	}

	public async seed(options: StoreSeedOptions) {
		await Promise.all(new Array(options.totalToSeed).fill(0).map(() => this.createOne({
			firstName: 'hola!'
		})))
	}
}
