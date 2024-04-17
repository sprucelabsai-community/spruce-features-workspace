import { Level, LogTransport } from '@sprucelabs/spruce-skill-utils'

export default function (): {
    levels: Level[]
    transport: LogTransport | undefined
} | null {
    return {
        //@ts-ignore
        levels: 'aoeu',
    }
}
