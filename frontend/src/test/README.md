# Frontend Unit Tests

## Overview
This directory contains unit tests for the IndieHub frontend application using Vitest and React Testing Library.

## Test Files

### `Profile.test.tsx`
Tests for the Profile page component:
- ✅ Renders profile information correctly
- ✅ Email masking functionality
- ✅ Profile image upload/removal
- ✅ Password change validation
- ✅ API integration
- ✅ Error handling

**Total Tests:** 10

### `Layout.test.tsx`
Tests for the Layout component:
- ✅ Authenticated vs unauthenticated states
- ✅ User avatar display
- ✅ Navigation links visibility
- ✅ Default avatar fallback
- ✅ Language switching
- ✅ Role-based navigation

**Total Tests:** 12

### `AuthContext.test.tsx`
Tests for the AuthContext:
- ✅ Initialization from localStorage
- ✅ Login functionality
- ✅ Registration and auto-login
- ✅ Logout functionality
- ✅ setUser method
- ✅ Error handling for corrupted data

**Total Tests:** 8

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Coverage

The test suite covers:
- **Profile Management**: Image upload/removal, password changes, email masking
- **Authentication**: Login, logout, registration, state management
- **UI Components**: Layout, navigation, role-based rendering
- **Error Handling**: API errors, validation errors, corrupted data

## Configuration

Tests are configured in `vitest.config.ts` with:
- **Environment**: jsdom (browser-like environment)
- **Setup**: `src/test/setup.ts` for global test configuration
- **Coverage**: v8 provider with HTML, JSON, and text reports

## Writing New Tests

1. Create test file with `.test.tsx` or `.test.ts` extension
2. Import testing utilities from `@testing-library/react`
3. Use `describe` blocks to group related tests
4. Use `it` or `test` for individual test cases
5. Mock external dependencies with `vi.mock()`

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Mocking

### API Mocking
```typescript
vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));
```

### localStorage Mocking
```typescript
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Test user behavior**: Focus on what users do, not implementation
3. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
4. **Clean up**: Tests automatically clean up after each test
5. **Mock external dependencies**: Keep tests isolated and fast

## Troubleshooting

### Tests not finding components
- Ensure components are wrapped in necessary providers (AuthProvider, LanguageProvider, BrowserRouter)
- Check that imports are correct

### Async tests timing out
- Use `waitFor` for async operations
- Increase timeout if needed: `{ timeout: 5000 }`

### Mock not working
- Clear mocks in `beforeEach`: `vi.clearAllMocks()`
- Ensure mock is defined before component render
