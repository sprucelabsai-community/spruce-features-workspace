module.exports = {
    default:[
        {
            eventSignatures: {
                [`{{namespace}}.my-cool-event::v2021_01_22`]: {
                    tacoBravo: 'is-not-allowed',
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