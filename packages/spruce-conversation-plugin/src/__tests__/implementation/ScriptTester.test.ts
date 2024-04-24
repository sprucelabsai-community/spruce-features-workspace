import { SkillContext } from '@sprucelabs/spruce-skill-utils'
import { test, assert, errorAssert } from '@sprucelabs/test-utils'
import AbstractConversationTest from '../../tests/AbstractConversationTest'
import ScriptTester, {
    END_OF_LINE,
    generateTransitionMessage,
    ScriptTesterOptions,
} from '../../tests/ScriptTester'
import { Script } from '../../types/conversation.types'

export default class ScriptTesterTest extends AbstractConversationTest {
    private static readonly basicBookingScript = [
        {
            utterances: [],
            key: 'bookAppointment',
            label: 'Book appointment',
            script: ['you ready to book?'],
        },
        {
            utterances: [],
            key: 'cancelAppointment',
            label: 'Cancel appointment',
            script: ['Lets cancel'],
        },
    ]

    @test()
    protected static async throwsWithoutScript() {
        //@ts-ignore
        const err = await assert.doesThrowAsync(() => ScriptTester.Tester())
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['script'],
        })
    }

    @test()
    protected static async acceptsSimpleScript() {
        const tester = await ScriptTesterTest.Tester({
            topics: [
                {
                    utterances: [],
                    key: 'bookAppointment',
                    label: 'Book appointment',
                    script: ['hey there!'],
                },
            ],
        })
        assert.isTruthy(tester)
    }

    @test()
    protected static async callingGoDoesntCrash() {
        const tester = await this.Tester({
            topics: [
                {
                    utterances: [],
                    key: 'bookAppointment',
                    label: 'Book appointment',
                    script: ['hey there!'],
                },
            ],
            writeHandler: () => {},
            selectPromptHandler: async () => '',
            promptHandler: async () => await new Promise(() => {}),
        })

        void tester.go()
    }

    @test()
    protected static async cantHandleMessageBeforeStartup() {
        const tester = await this.Tester({
            topics: [
                {
                    utterances: [],
                    key: 'bookAppointment',
                    label: 'Book appointment',
                    script: ['hey there!'],
                },
            ],
            writeHandler: () => {},
            selectPromptHandler: async () => '',
            promptHandler: async () => '',
        })

        const err = await assert.doesThrowAsync(() =>
            tester.handleInput('taco')
        )

        errorAssert.assertError(err, 'TESTER_NOT_STARTED')
    }

    @test()
    protected static async selectingBadScriptToStartThrows() {
        const tester = await this.Tester({
            topics: this.basicBookingScript,
            selectPromptHandler: async () => {
                return 'oeuou'
            },
            writeHandler: () => {},
            promptHandler: async () => '',
        })

        const err = await assert.doesThrowAsync(() => tester.go())

        errorAssert.assertError(err, 'TOPIC_NOT_FOUND', {
            suppliedTopic: 'oeuou',
            validTopics: ['bookAppointment', 'cancelAppointment'],
        })
    }

    @test()
    protected static async asksWhichScriptYouWantToStartWithWhenThereIsMoreThanOne() {
        let choices: any
        const writes: string[] = []
        const tester = await this.Tester({
            topics: this.basicBookingScript,
            selectPromptHandler: async (message) => {
                choices = message.choices ?? []
                return 'cancelAppointment'
            },
            writeHandler: (message) => {
                writes.push(message.body)
            },
            promptHandler: async () => await new Promise(() => {}),
        })

        void tester.go('go team')

        assert.isEqualDeep(choices, [
            {
                value: 'bookAppointment',
                label: 'Book appointment',
            },
            {
                value: 'cancelAppointment',
                label: 'Cancel appointment',
            },
        ])

        await this.wait(10)

        assert.doesInclude(writes, 'Lets cancel')
    }

    @test('plays single line script', ['hey there'])
    @test('plays multi line script', ['hey there', 'how are you?'])
    protected static async playsSimpleScript(script: Script) {
        const writes: string[] = []
        const tester = await this.Tester({
            shouldPlayReplayAfterFinish: false,
            lineDelay: 0,
            topics: [{ key: 'test', label: 'Testing', script, utterances: [] }],
            writeHandler: (message) => {
                writes.push(message.body)
            },
            selectPromptHandler: async () => '',
            promptHandler: async () => '',
        })

        assert.isLength(writes, 0)

        void tester.go('hey there!')

        await this.wait(10)

        const expected = [
            ...script,
            generateTransitionMessage('discovery'),
            END_OF_LINE,
        ]

        assert.isLength(writes, expected.length)
        assert.isEqualDeep(writes, expected)
    }

    @test('passes the confirm', 'yes')
    @test('fails the confirm', 'no')
    protected static async canSendInputToThePlayer(answer: string) {
        const writes: string[] = []
        const tester = await this.Tester({
            shouldPlayReplayAfterFinish: false,
            topics: [
                {
                    utterances: [],
                    key: 'test',
                    label: 'Test with prompt',
                    script: [
                        async (options) => {
                            const confirm =
                                await options.ui.confirm('Are you sure?')

                            if (confirm) {
                                options.ui.renderLine('yes')
                            } else {
                                options.ui.renderLine('no')
                            }
                        },
                    ],
                },
            ],
            writeHandler: (message) => {
                writes.push(message.body)
            },
            promptHandler: async () => {
                return answer
            },
            selectPromptHandler: async () => '',
        })

        void tester.go('lets go!')

        await this.wait(20)

        const expected = [
            'Are you sure?',
            answer,
            generateTransitionMessage('discovery'),
            END_OF_LINE,
        ]
        assert.isEqualDeep(writes, expected)
    }

    @test()
    protected static async promptsForFirstMessageIfNoneSentToGo() {
        const writes: string[] = []
        const promptWrites: string[] = []
        let promptResolve: any

        const tester = await this.Tester({
            lineDelay: 0,
            topics: [
                {
                    utterances: [],
                    key: 'test',
                    label: 'Test with prompt',
                    script: ['go', 'team'],
                },
            ],
            writeHandler: (message) => {
                writes.push(message.body)
            },
            promptHandler: async (message) => {
                promptWrites.push(message.body)
                await new Promise((resolve) => (promptResolve = resolve))
                return 'go!'
            },
            selectPromptHandler: async () => '',
        })

        void tester.go()

        await this.wait(10)

        assert.isLength(promptWrites, 1)

        assert.isLength(writes, 0)

        promptResolve()

        await this.wait(10)

        const expected = [
            'go',
            'team',
            generateTransitionMessage('discovery'),
            END_OF_LINE,
        ]

        assert.isEqualDeep(writes, expected)
    }

    @test()
    protected static async showsConfidenceRatingBasedOnFirstMesageSent() {
        const writes: string[] = []
        const promptWrites: string[] = []

        const tester = await this.Tester({
            lineDelay: 0,
            topics: [
                {
                    utterances: ['go team', 'team'],
                    key: 'test',
                    label: 'Test with prompt',
                    script: ['go', 'team'],
                },
            ],
            writeHandler: (message) => {
                writes.push(message.body)
            },
            promptHandler: async (message) => {
                promptWrites.push(message.body)
                return 'go!'
            },
            selectPromptHandler: async () => '',
        })

        void tester.go('team')

        await this.wait(10)

        assert.doesInclude(writes, `%`)
    }

    @test()
    protected static async promptsToStartAgainAfterDone() {
        const writes: string[] = []
        let promptHitCount = 0
        const tester = await this.Tester({
            lineDelay: 0,
            topics: [
                {
                    utterances: [],
                    key: 'test',
                    label: 'Test with prompt',
                    script: ['go', 'team'],
                },
            ],
            writeHandler: (message) => {
                writes.push(message.body)
            },
            promptHandler: async () => {
                promptHitCount++
                if (promptHitCount > 2) {
                    await new Promise(() => {})
                }
                return 'go!'
            },
            selectPromptHandler: async () => '',
        })

        void tester.go()

        await this.wait(500)

        assert.isEqual(promptHitCount, 3)

        assert.isEqualDeep(writes, [
            'go',
            'team',
            generateTransitionMessage('discovery'),
            END_OF_LINE,
            'go',
            'team',
            generateTransitionMessage('discovery'),
            END_OF_LINE,
        ])
    }

    @test()
    protected static async messagesAboutTransitionResponseTopicChanger() {
        const writes: string[] = []
        let promptHitCount = 0
        const tester = await this.Tester({
            lineDelay: 0,
            topics: [
                {
                    key: 'test',
                    label: 'Test with prompt',
                    utterances: [],
                    script: [
                        'my',
                        'team',
                        async () => {
                            return {
                                transitionConversationTo: 'greeting',
                                topicChangers: ['topic_changer'],
                            }
                        },
                    ],
                },
            ],
            writeHandler: (message) => {
                writes.push(message.body)
            },
            promptHandler: async () => {
                promptHitCount++
                if (promptHitCount > 2) {
                    await new Promise(() => {})
                }
                return 'go!'
            },
            selectPromptHandler: async () => '',
        })

        void tester.go()

        await this.wait(500)

        assert.isEqual(promptHitCount, 3)

        assert.isEqualDeep(writes, [
            'my',
            'team',
            'topic_changer',
            generateTransitionMessage('greeting'),
            END_OF_LINE,
            'my',
            'team',
            'topic_changer',
            generateTransitionMessage('greeting'),
            END_OF_LINE,
        ])
    }

    @test()
    protected static async messagesAboutTransitionResponseWithRepairs() {
        const writes: string[] = []
        let promptHitCount = 0
        const tester = await this.Tester({
            lineDelay: 0,
            topics: [
                {
                    key: 'test',
                    label: 'Test with prompt',
                    utterances: [],
                    script: [
                        'my',
                        'team',
                        async () => {
                            return {
                                transitionConversationTo: 'greeting',
                                repairs: ['repairs'],
                            }
                        },
                    ],
                },
            ],
            writeHandler: (message) => {
                writes.push(message.body)
            },
            promptHandler: async () => {
                promptHitCount++
                if (promptHitCount > 2) {
                    await new Promise(() => {})
                }
                return 'go!'
            },
            selectPromptHandler: async () => '',
        })

        void tester.go()

        await this.wait(500)

        assert.isEqual(promptHitCount, 3)

        assert.isEqualDeep(writes, [
            'my',
            'team',
            'repairs',
            generateTransitionMessage('greeting'),
            END_OF_LINE,
            'my',
            'team',
            'repairs',
            generateTransitionMessage('greeting'),
            END_OF_LINE,
        ])
    }

    private static async Tester(options: Partial<ScriptTesterOptions>) {
        return await ScriptTester.Tester({
            getContext: () => ({}) as SkillContext,
            topics: [],
            ...options,
        })
    }
}
