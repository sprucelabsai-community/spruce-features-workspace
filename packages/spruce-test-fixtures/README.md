# Spruce Test Fixtures

A comprehensive testing utilities package for Spruce that provides fixtures and helpers for unit and integration testing Spruce skills and applications.

## Features

### Base Test Class

`AbstractSpruceFixtureTest` extends AbstractSkillTest and provides lifecycle hooks for test setup/teardown.

```typescript
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'

export default class MyTest extends AbstractSpruceFixtureTest {
    @test()
    protected async canRunTest() {
        // Your test here
    }
}
```

### Core Fixtures

| Fixture | Description |
|---------|-------------|
| `OrganizationFixture` | Create and manage test organizations |
| `LocationFixture` | Create and manage test locations |
| `PersonFixture` | Create test persons, handle login/authentication |
| `SkillFixture` | Manage skill setup and configuration |
| `ViewFixture` | Test view controllers with mocked UI components |
| `StoreFixture` | Database store testing utilities |
| `RoleFixture` | Test role-based access control |
| `PermissionFixture` | Test permission handling |
| `MercuryFixture` | Mercury event client setup |

### Test Decorators

```typescript
import { fake, login, seed, install } from '@sprucelabs/spruce-test-fixtures'

export default class MyTest extends AbstractSpruceFixtureTest {
    @login()
    @seed('organizations', 1)
    @test()
    protected async canTestWithSeededData() {
        // Test runs with logged-in user and seeded organization
    }
}
```

| Decorator | Description |
|-----------|-------------|
| `@fake` | Fake API responses |
| `@login` | Login as specific user |
| `@seed` | Seed test data |
| `@install` | Handle skill installation |

### Spy & Mock Utilities

- **FakeAuthorizer** - Mock authorization for testing
- **SpyAuthenticator** - Spy on authentication calls
- **SpyViewControllerFactory** - Track view controller instantiation
- **TestRouter** - Route events in test environment
- **SpyMapUtil** - Spy on Map operations

## Development

```bash
# Install dependencies
yarn

# Build
yarn build.dev

# Run tests
yarn test
```

## Documentation

For comprehensive documentation, visit [developer.spruce.bot](https://developer.spruce.bot).

[![AI TDD Contributor](https://regressionproof.ai/badge.svg)](https://regressionproof.ai)
