import { formatPhoneNumber } from '@sprucelabs/schema'
import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import { AbstractSpruceFixtureTest } from '../..'
import phoneNumberIncrementor, {
    GenerateOptions,
} from '../../utilities/phoneNumberIncrementor'

export default class PhoneNumberIncrementorTest extends AbstractSpruceFixtureTest {
    @test()
    protected static async canCreatePhoneNumberIncrementor() {
        assert.isTruthy(phoneNumberIncrementor)
        assert.isFunction(phoneNumberIncrementor.generate)
    }

    @test('throws if all options missing', {}, [
        'startingPhone',
        'totalToGenerate',
    ])
    @test(
        'throws if totalToGenerate options missing',
        { startingPhone: '234234' },
        ['totalToGenerate']
    )
    @test(
        'throws if startingPhone options missing',
        { totalToGenerate: 1234 },
        ['startingPhone']
    )
    protected static async throwsWithMissingOptions(
        options: any,
        parameters: string[]
    ) {
        const err = await assert.doesThrowAsync(() =>
            phoneNumberIncrementor.generate(options)
        )

        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters,
        })
    }

    @test('throws if phone is 234234', '234234')
    @test('throws if phone is 0000', '000')
    protected static async throwsWithBadNumber(phone: string) {
        const err = await assert.doesThrowAsync(() =>
            this.generate({
                startingPhone: phone,
            })
        )

        errorAssert.assertError(err, 'INVALID_PARAMETERS', {
            parameters: ['startingPhone'],
        })
    }

    @test('generates 10 numbers', 10)
    @test('generates 20 numbers', 20)
    protected static async generatesExpectedNumberOfNumbers(total: number) {
        const numbers = await this.generate({
            totalToGenerate: total,
        })

        assert.isLength(numbers, total)
    }

    @test()
    protected static async handlesFormattedNumber() {
        await this.generate({
            startingPhone: formatPhoneNumber('000-000-0000', false),
        })
    }

    @test('generates 2 expected', ['+1 000-000-0000', '+1 000-000-0001'])
    @test('generates 4 expected', [
        '+1 000-000-0000',
        '+1 000-000-0001',
        '+1 000-000-0002',
        '+1 000-000-0003',
    ])
    protected static async generatesExpectedNumbers(expected: string[]) {
        const numbers = await this.generate({
            totalToGenerate: expected.length,
        })
        assert.isEqualDeep(numbers, expected)
    }

    @test()
    protected static async generateNumbersFromDifferentStartNumber() {
        const numbers = this.generate({ startingPhone: '001-000-0001' })
        assert.isEqualDeep(numbers, ['+1 001-000-0001', '+1 001-000-0002'])
    }

    private static generate(options?: Partial<GenerateOptions>): any {
        return phoneNumberIncrementor.generate({
            startingPhone: '000-000-0000',
            totalToGenerate: 2,
            ...options,
        })
    }
}
