import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'













export declare namespace SpruceErrors.SpruceTestFixtures {

	
	export interface UnknownViewControllerError {
		
			
			'id'?: string| undefined | null
			
			'name'?: string| undefined | null
	}

	export interface UnknownViewControllerErrorSchema extends SpruceSchema.Schema {
		id: 'unknownViewControllerError',
		namespace: 'SpruceTestFixtures',
		name: 'Unkown view controller error',
		    fields: {
		            /** . */
		            'id': {
		                type: 'text',
		                options: undefined
		            },
		            /** . */
		            'name': {
		                type: 'text',
		                options: undefined
		            },
		    }
	}

	export type UnknownViewControllerErrorEntity = SchemaEntity<SpruceErrors.SpruceTestFixtures.UnknownViewControllerErrorSchema>

}


export declare namespace SpruceErrors.SpruceTestFixtures {

	
	export interface SkillNotFound {
		
			
			'slug': string
	}

	export interface SkillNotFoundSchema extends SpruceSchema.Schema {
		id: 'skillNotFound',
		namespace: 'SpruceTestFixtures',
		name: 'Skill not found',
		    fields: {
		            /** . */
		            'slug': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type SkillNotFoundEntity = SchemaEntity<SpruceErrors.SpruceTestFixtures.SkillNotFoundSchema>

}


export declare namespace SpruceErrors.SpruceTestFixtures {

	
	export interface ScopeRequirementsNotMet {
		
	}

	export interface ScopeRequirementsNotMetSchema extends SpruceSchema.Schema {
		id: 'scopeRequirementsNotMet',
		namespace: 'SpruceTestFixtures',
		name: 'scope requirements not met',
		    fields: {
		    }
	}

	export type ScopeRequirementsNotMetEntity = SchemaEntity<SpruceErrors.SpruceTestFixtures.ScopeRequirementsNotMetSchema>

}


export declare namespace SpruceErrors.SpruceTestFixtures {

	
	export interface NotFound {
		
	}

	export interface NotFoundSchema extends SpruceSchema.Schema {
		id: 'notFound',
		namespace: 'SpruceTestFixtures',
		name: 'not found',
		    fields: {
		    }
	}

	export type NotFoundEntity = SchemaEntity<SpruceErrors.SpruceTestFixtures.NotFoundSchema>

}


export declare namespace SpruceErrors.SpruceTestFixtures {

	
	export interface InvalidViewController {
		
			
			'name'?: string| undefined | null
			
			'id'?: string| undefined | null
	}

	export interface InvalidViewControllerSchema extends SpruceSchema.Schema {
		id: 'invalidViewController',
		namespace: 'SpruceTestFixtures',
		name: 'Invalid view controller',
		    fields: {
		            /** . */
		            'name': {
		                type: 'text',
		                options: undefined
		            },
		            /** . */
		            'id': {
		                type: 'text',
		                options: undefined
		            },
		    }
	}

	export type InvalidViewControllerEntity = SchemaEntity<SpruceErrors.SpruceTestFixtures.InvalidViewControllerSchema>

}


export declare namespace SpruceErrors.SpruceTestFixtures {

	
	export interface InvalidTarget {
		
	}

	export interface InvalidTargetSchema extends SpruceSchema.Schema {
		id: 'invalidTarget',
		namespace: 'SpruceTestFixtures',
		name: 'invalid target',
		    fields: {
		    }
	}

	export type InvalidTargetEntity = SchemaEntity<SpruceErrors.SpruceTestFixtures.InvalidTargetSchema>

}


export declare namespace SpruceErrors.SpruceTestFixtures {

	
	export interface InvalidScopeRequest {
		
			
			'flags': string[]
			
			'attemptedToGet': ("location" | "organization")
	}

	export interface InvalidScopeRequestSchema extends SpruceSchema.Schema {
		id: 'invalidScopeRequest',
		namespace: 'SpruceTestFixtures',
		name: '',
		    fields: {
		            /** . */
		            'flags': {
		                type: 'text',
		                isRequired: true,
		                isArray: true,
		                options: undefined
		            },
		            /** . */
		            'attemptedToGet': {
		                type: 'select',
		                isRequired: true,
		                options: {choices: [{"value":"location","label":"Location"},{"value":"organization","label":"Organization"}],}
		            },
		    }
	}

	export type InvalidScopeRequestEntity = SchemaEntity<SpruceErrors.SpruceTestFixtures.InvalidScopeRequestSchema>

}


export declare namespace SpruceErrors.SpruceTestFixtures {

	
	export interface InvalidFixture {
		
			
			'suppliedName': string
			
			'validNames': string[]
	}

	export interface InvalidFixtureSchema extends SpruceSchema.Schema {
		id: 'invalidFixture',
		namespace: 'SpruceTestFixtures',
		name: 'Invalid factory',
		    fields: {
		            /** . */
		            'suppliedName': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		            /** . */
		            'validNames': {
		                type: 'text',
		                isRequired: true,
		                isArray: true,
		                options: undefined
		            },
		    }
	}

	export type InvalidFixtureEntity = SchemaEntity<SpruceErrors.SpruceTestFixtures.InvalidFixtureSchema>

}


export declare namespace SpruceErrors.SpruceTestFixtures {

	
	export interface FakeEventError {
		
			
			'fqen': string
	}

	export interface FakeEventErrorSchema extends SpruceSchema.Schema {
		id: 'fakeEventError',
		namespace: 'SpruceTestFixtures',
		name: 'Fake event error',
		    fields: {
		            /** . */
		            'fqen': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type FakeEventErrorEntity = SchemaEntity<SpruceErrors.SpruceTestFixtures.FakeEventErrorSchema>

}




