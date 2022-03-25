import { AbstractStore } from '@sprucelabs/data-stores'
import { buildSchema } from '@sprucelabs/schema'
import { StoreSeedOptions } from '../../types/store.types'

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

	public static seedCb?: () => void
	public static wasSeedInvoked = false
	public static seedOptions = {}
	public static Store(options: any) {
		return new this(options)
	}

	public seed(options: StoreSeedOptions) {
		DummyStore.wasSeedInvoked = true
		DummyStore.seedOptions = options
		DummyStore.seedCb?.()
	}
}
