module.exports = {
    default:[
        {
            eventSignatures: {
                [`{{namespace}}.my-cool-event::v2021_01_22`]: {
                    emitPayloadSchema: {
                        id:'targetAndPayload',
                        fields: {
                            payload: {
                                type: 'schema',
                                options: {
                                    schema: {
                                        id: 'emitPayload',
                                        fields: {
                                            foo: {
                                                type: 'text'
                                            },
                                            bar: {
                                                type: 'text'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responsePayloadSchema: {
						id: 'responsePayload',
						fields: {
							taco: {
								type: 'text',
							},
						},
					},
                }
            }
        }
    ]
}