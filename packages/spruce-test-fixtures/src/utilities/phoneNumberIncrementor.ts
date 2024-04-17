import {
    assertOptions,
    formatPhoneNumber,
    isValidNumber,
    SchemaError,
} from '@sprucelabs/schema'

export interface GenerateOptions {
    startingPhone: string
    totalToGenerate: number
}
const phoneNumberIncrementor = {
    generate(options: GenerateOptions) {
        assertOptions(options, ['startingPhone', 'totalToGenerate'])

        const { startingPhone, totalToGenerate } = options

        if (!isValidNumber(startingPhone)) {
            throw new SchemaError({
                code: 'INVALID_PARAMETERS',
                parameters: ['startingPhone'],
            })
        }

        const numbers = [formatPhoneNumber(startingPhone)]

        const parsed = parseInt(startingPhone.replace(/[^0-9]/gi, ''))

        for (let c = 1; c < totalToGenerate; c++) {
            const padded = `${parsed + c}`.padStart(10, '0')
            numbers.push(formatPhoneNumber(padded))
        }

        return numbers
    },
}

export default phoneNumberIncrementor
