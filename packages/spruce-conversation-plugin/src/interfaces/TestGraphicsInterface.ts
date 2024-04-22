import { Message } from '../types/conversation.types'
import MessageGraphicsInterface, {
    MessageGraphicsInterfaceOptions,
} from './MessageGraphicsInterface'

export type PromptHandler = (message: Pick<Message, 'body'>) => Promise<string>

export default class TestGraphicsInterface extends MessageGraphicsInterface {
    private promptHandler: PromptHandler
    public constructor(
        options: MessageGraphicsInterfaceOptions & {
            promptHandler: PromptHandler
        }
    ) {
        super(options)
        this.promptHandler = options.promptHandler
    }

    protected waitForNextMessage(): Promise<string> {
        return this.promptHandler({ body: ':' })
    }
}
