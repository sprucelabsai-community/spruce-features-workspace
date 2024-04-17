import { diskUtil, Level, LogTransport } from '@sprucelabs/spruce-skill-utils'

export default function (): {
    levels: Level[]
    transport: LogTransport
} | null {
    return {
        levels: ['WARN'],
        transport: (...messageParts: string[]) => {
            const message = messageParts.join(' ')
            diskUtil.writeFile(
                diskUtil.resolvePath(__dirname, '..', '..', 'error.txt'),
                message
            )
        },
    }
}
