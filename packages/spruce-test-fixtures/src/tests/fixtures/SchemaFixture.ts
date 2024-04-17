export default class SchemaFixture {
    public static beforeEach() {
        process.env.SHOULD_VALIDATE_SCHEMAS_ON_BOOT = 'false'
    }
}
