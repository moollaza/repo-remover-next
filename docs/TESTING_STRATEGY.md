# Testing Strategy

---

## Test Types

| Type | Tool | Coverage Target | Purpose |
|------|------|-----------------|---------|
| **Unit** | Vitest + RTL | 70% | Component logic, hooks, utils |
| **Integration** | Vitest + MSW | 20% | Provider + API layer |
| **E2E** | Playwright | 10% | Critical user flows |
| **Visual** | Storybook + Chromatic | All UI | Regression prevention |

---

## Testing Presentational Components (NEW PATTERN)

**Rule**: Presentational components test via **props only** (no mocks needed)

```typescript
// ✅ Good - Test presentational component
import { render, screen } from '@testing-library/react';
import Dashboard from './dashboard';

test('shows error alert', () => {
  render(<Dashboard repos={null} isError={true} />);
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

**vs Container Components** (test via integration)

```typescript
// ✅ Good - Test container with provider
import { renderWithProviders } from '@/utils/test-utils';
import DashboardPage from './page';

test('redirects when not authenticated', async () => {
  renderWithProviders(<DashboardPage />);
  // Uses real provider + MSW mocks
});
```

---

## MSW Setup (After Migration)

### Operation-Based Handlers

```typescript
// src/mocks/handlers.ts
export const handlers = [
  graphql.query('GetRepositories', () => {
    return HttpResponse.json({
      data: { user: { repositories: { nodes: MOCK_REPOS } } }
    });
  }),

  graphql.query('GetCurrentUser', () => {
    return HttpResponse.json({ data: { viewer: MOCK_USER } });
  })
];
```

### Per-Test Overrides

```typescript
test('handles network error', async () => {
  server.use(
    graphql.query('GetRepositories', () => HttpResponse.error())
  );

  render(<Component />);
  // Test error handling
});
```

---

## Story Testing (NEW PATTERN)

**Before** (Complex):
```typescript
decorators: [AuthenticatedUserDecorator, PageDecorator],
parameters: { msw: { handlers: [/* 100+ lines */] } }
```

**After** (Simple):
```typescript
export const Default: Story = {
  args: { repos: MOCK_REPOS, isLoading: false }
};
```

**Required Stories Per Component**:
- Default state
- Loading state
- Error state
- Empty state
- Edge cases (if applicable)

---

## Query Priority (React Testing Library)

```typescript
// 1. Accessible queries (prefer these)
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByPlaceholderText(/enter email/i)
screen.getByText(/welcome/i)

// 2. Semantic queries
screen.getByAltText(/profile/i)
screen.getByTitle(/close/i)

// 3. Test IDs (last resort)
screen.getByTestId('custom-element')
```

---

## Custom Render Utility

**Create**: `src/utils/test-utils/render.tsx`

```typescript
import { render } from '@testing-library/react';
import { GitHubDataProvider } from '@/providers/github-data-provider';

export function renderWithProviders(ui, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => <GitHubDataProvider>{children}</GitHubDataProvider>,
    ...options
  });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
```

**Usage**:
```typescript
import { render } from '@/utils/test-utils';  // Auto-wrapped
```

---

## Test Structure Template

```typescript
describe('ComponentName', () => {
  // Setup
  const defaultProps = { ... };

  it('renders with default props', () => {
    render(<Component {...defaultProps} />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(<Component {...defaultProps} onAction={onAction} />);

    await user.click(screen.getByRole('button'));

    expect(onAction).toHaveBeenCalled();
  });

  it('shows error state', () => {
    render(<Component {...defaultProps} isError={true} />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

---

## Coverage Requirements Per Recommendation

| Rec | Component/Feature | Unit Tests | Stories | E2E |
|-----|-------------------|------------|---------|-----|
| #1 | Dashboard (presentational) | ✅ >90% | ✅ 6 states | ❌ (page tested) |
| #1 | DashboardPage (container) | ⚠️ Optional | ❌ N/A | ✅ Full flow |
| #2 | Custom render utility | ✅ Examples | ❌ N/A | ❌ N/A |
| #3 | Error boundary | ✅ Error scenarios | ✅ Fallback UI | ✅ Error display |
| #4 | MSW handlers | ✅ All tests use | ❌ N/A | ❌ N/A |
| #5 | useRepoFilters hook | ✅ >95% | ❌ N/A | ❌ N/A |
| #6 | Missing components | ✅ Added | ✅ Added | ⚠️ If critical |

---

## Commands

### Development
```bash
npm run test:unit -- --watch      # Fast feedback loop
npm run test:e2e:headed           # Debug E2E
npm run storybook                 # Visual review
```

### Pre-Commit
```bash
npm run lint:fix
npm run test:unit
npm run build
```

### Pre-Push
```bash
npm run test:all                  # Unit + E2E
npm run build
npm run chromatic                 # Visual regression
```

### Coverage
```bash
npm run test:unit -- --coverage   # Check coverage %
```

---

## Common Patterns

### Testing Async Operations
```typescript
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

### Testing User Events
```typescript
const user = userEvent.setup();
await user.type(input, 'text');
await user.click(button);
```

### Testing Error Boundaries
```typescript
const ThrowError = () => { throw new Error('Test'); };

render(
  <ErrorBoundary>
    <ThrowError />
  </ErrorBoundary>
);

expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
```

---

## What NOT to Test

❌ Implementation details (state variable names, function names)
❌ Third-party library internals (HeroUI, Next.js)
❌ Styling/CSS (use Chromatic instead)
❌ Trivial getters/setters

---

## Validation After Each Change

```bash
npm run test:unit    # Fast - must pass
npm run build        # Must succeed
npm run storybook    # Verify no regressions
npm run test:e2e     # Slower - critical flows
```

**Target**: All green before pushing ✅
