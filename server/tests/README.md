# Surf Forecast API - Integration Tests

This directory contains comprehensive integration tests for the Surf Forecast API. These tests verify that all components work correctly together, including database operations, external API integrations, and complete request-response flows.

## Test Structure

```
tests/
├── README.md                    # This documentation
├── setup.js                     # Global test setup and configuration
├── helpers/
│   ├── database.js             # Database test utilities
│   └── mocks.js                # External API mocks
└── integration/
    ├── health.test.js          # Health endpoint tests
    ├── spots.test.js           # Surf spots endpoint tests
    ├── forecast.test.js        # Forecast endpoint tests
    └── preferences.test.js     # User preferences endpoint tests
```

## Prerequisites

### 1. Test Database Setup

Create a separate test database to avoid affecting your development data:

```bash
# Create test database
createdb surf_forecast_test

# Initialize test database with schema
psql -d surf_forecast_test -f server/src/models/init.sql
```

### 2. Environment Variables

Create a `.env.test` file or set environment variables for testing:

```bash
# Test database configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=surf_forecast_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=your_password

# Or use existing DB variables (tests will use TEST_* if available)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=surf_forecast_test  # Use test database
DB_USER=postgres
DB_PASSWORD=your_password

NODE_ENV=test
```

## Running Tests

### Install Dependencies
```bash
cd server
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Files
```bash
# Run only health tests
npx jest tests/integration/health.test.js

# Run only spots tests
npx jest tests/integration/spots.test.js

# Run tests matching a pattern
npx jest --testNamePattern="should return"
```

## Test Categories

### 1. Health Endpoint Tests (`health.test.js`)
- **GET /api/health** - Basic health check functionality
- **GET /api/test** - Server response validation
- **404 handling** - Non-existent route handling
- **CORS headers** - Cross-origin request support
- **HTTP methods** - Method validation

**Key Test Cases:**
- Health status response structure
- Response time validation (< 100ms)
- JSON content type verification
- Available routes in 404 responses

### 2. Spots Endpoint Tests (`spots.test.js`)
- **GET /api/spots** - All surf spots retrieval
- **GET /api/spots/nearby** - Location-based spot search
- **GET /api/spots/:id** - Individual spot retrieval
- **Data validation** - Coordinate and difficulty level validation
- **Error handling** - Database error scenarios

**Key Test Cases:**
- Spots ordered by name
- Distance calculations using Haversine formula
- Radius parameter handling (default 50km)
- Invalid coordinate handling
- Non-existent spot ID responses

### 3. Forecast Endpoint Tests (`forecast.test.js`)
- **GET /api/forecast/spot/:id** - Individual spot forecasts
- **POST /api/forecast/ranked** - User preference-based ranking
- **POST /api/forecast/conditions** - Batch conditions retrieval
- **External API mocking** - Weather service integration
- **Error handling** - External API failure scenarios

**Key Test Cases:**
- Forecast data structure validation
- User preference integration
- Location-based spot filtering
- External API failure graceful handling
- Session-based preference retrieval

### 4. Preferences Endpoint Tests (`preferences.test.js`)
- **POST /api/preferences** - Create/update user preferences
- **GET /api/preferences/:sessionId** - Retrieve user preferences
- **Data validation** - Skill level and numeric range validation
- **Update scenarios** - Existing preference modification
- **Error handling** - Missing required fields

**Key Test Cases:**
- New preference creation
- Existing preference updates
- Required field validation (sessionId, skillLevel)
- Numeric data type handling
- Special character session ID support

## Test Utilities

### Database Helper (`helpers/database.js`)
Provides utilities for test database management:

```javascript
const DatabaseTestHelper = require('../helpers/database');
const dbHelper = new DatabaseTestHelper(global.testPool);

// Initialize test database with schema
await dbHelper.initializeTestDatabase();

// Clean all tables
await dbHelper.cleanDatabase();

// Seed test data
await dbHelper.seedTestData();

// Get test entities
const testSpot = await dbHelper.getTestSpot('Test Beach');
const userPrefs = await dbHelper.getTestUserPreferences('test-session-123');
```

### Mock Helper (`helpers/mocks.js`)
Provides external API mocking capabilities:

```javascript
const MockHelper = require('../helpers/mocks');

// Setup default mocks for all external APIs
MockHelper.setupDefaultMocks();

// Mock API failures
MockHelper.mockWeatherAPIFailure();

// Generate mock forecast data
const mockData = MockHelper.generateMockForecastData(spotId);

// Clean all mocks
MockHelper.cleanAll();
```

## Test Data

### Test Surf Spots
The test suite creates these surf spots for testing:
- **Test Beach** (33.7701, -118.1937) - Beginner, Beach Break
- **Advanced Reef** (33.8000, -118.2000) - Advanced, Reef Break  
- **Intermediate Point** (33.7500, -118.1500) - Intermediate, Point Break

### Test User Preferences
- **test-session-123** - Intermediate surfer, 2-8ft waves, 15mph max wind
- **test-session-456** - Beginner surfer, 1-5ft waves, 20mph max wind

## External API Mocking

Tests mock these external services:
- **Weather APIs** - OpenWeatherMap, Marine Weather
- **Tide APIs** - NOAA Tides and Currents
- **Forecast Services** - Wave height, period, direction data

Mock responses include:
- Successful API responses with realistic data
- API failure scenarios (500, 503 errors)
- Rate limiting and timeout scenarios
- Malformed response handling

## Coverage Goals

The test suite aims for:
- **Line Coverage**: > 80%
- **Function Coverage**: > 90%
- **Branch Coverage**: > 75%
- **Statement Coverage**: > 85%

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: surf_forecast_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd server && npm install
      - run: cd server && npm test
        env:
          TEST_DB_HOST: localhost
          TEST_DB_NAME: surf_forecast_test
          TEST_DB_USER: postgres
          TEST_DB_PASSWORD: postgres
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```
   Error: Failed to connect to test database
   ```
   - Ensure PostgreSQL is running
   - Verify test database exists: `createdb surf_forecast_test`
   - Check environment variables

2. **Test Timeout Errors**
   ```
   Error: Timeout - Async callback was not invoked within the 10000ms timeout
   ```
   - Increase timeout in `jest.config.js`
   - Check for hanging database connections
   - Verify external API mocks are properly set up

3. **Mock Not Working**
   ```
   Error: External API call failed in tests
   ```
   - Ensure `MockHelper.setupDefaultMocks()` is called
   - Check nock interceptors are properly configured
   - Verify API URLs match mock patterns

4. **Database State Issues**
   ```
   Error: Test data conflicts or unexpected results
   ```
   - Ensure `dbHelper.cleanDatabase()` is called in `beforeEach`
   - Check test isolation
   - Verify seed data is consistent

### Debug Mode

Run tests with debug output:
```bash
DEBUG=* npm test
NODE_ENV=test DEBUG=jest npm test
```

## Best Practices

1. **Test Isolation** - Each test should be independent
2. **Database Cleanup** - Always clean database between tests
3. **Mock External APIs** - Never make real API calls in tests
4. **Descriptive Names** - Use clear, descriptive test names
5. **Error Testing** - Test both success and failure scenarios
6. **Data Validation** - Verify response structure and data types
7. **Performance** - Keep tests fast (< 10s total runtime)

## Contributing

When adding new tests:
1. Follow existing test structure and naming conventions
2. Add appropriate database cleanup and mocking
3. Test both success and error scenarios
4. Update this documentation if adding new test categories
5. Ensure tests pass in isolation and as a suite