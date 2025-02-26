# Repo Remover (Next.js)

## Development TODO

- Encrypt localstorage or remove
- Improve Homepage Content
- Dark Theme
- Unit tests (Vitest)
- E2E tests (Playwright)
- Regression Tests (Storybook)

## Try it now at https://next.reporemover.xyz

> [!NOTE]  
> This version is still a Work-In-Progress
> The core functionality is implemented, but changes are still happening

_Don't want to use the hosted version? You can run Repo Remover locally using the instructions below._

<p>
  <img src="https://img.shields.io/github/license/moollaza/repo-remover.svg?style=flat-square" />
  <a href="https://next.reporemover.xyz">
    <img src="https://img.shields.io/website/https/reporemover.xyz.svg?style=flat-square" >
  </a>
</p>

## How it works

Repo Remover uses [Personal Access Token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) along with the GitHub API to get a list of your personal repositories, and make changes to them.

Once you've provided a Personal Access Token, you can select which of your repos to modify, set the selected repos to be archived or deleted, and then click the button to make the changes!

Before any changes are made, you will be asked to review the list of selected repos, and confirm your decision.

**Note**: Personal Access Tokens are not stored by default. If you opt-in, PAT will be stored locally in your browser (localstorage, encrypted). For optimal security, we suggest you create a new token each time you use Repo Remover, and delete it when you are done.

## Run Repo Remover locally

1. Fork this repository to your own GitHub account and then clone it to your computer.
2. Install dependencies
   ```
   npm install
   ```
3. Run local server
   ```
   npm run build && npm run start
   ```
4. Visit http://localhost:3000/

### Run Development Build

1. Start the development server
   ```
   npm run dev
   ```
2. Visit http://localhost:3000/

## Built with

- [Next.js](https://nextjs.org/)
- [NextUI](https://nextui.org/)
- Hosted on [Vercel](https://vercel.com/)
- Privacy-focused analytics by [Fathom Analytics](https://usefathom.com/ref/E83PFO)
  - Want to know how many repos have been deleted? [Checkout the public analytics dashboard](https://app.usefathom.com/share/ikjnvhai/repo+remover)

## Author

Zaahir Moolla ([@zmoolla](https://bsky.app/profile/zmoolla.bsky.social), [zaahir.ca](https://zaahir.ca))

## Development

### Testing Setup

The project uses different types of tests:

1. **Unit Tests**: Using Vitest and React Testing Library with MSW for API mocking
2. **E2E Tests**: Using Playwright with real API calls

#### Setting up the test environment

1. Create a `.env.test` file in the root directory:

```env
# Required for E2E tests
GITHUB_TEST_TOKEN=your_valid_github_token
```

2. Install dependencies:

```bash
npm install
```

3. Run tests:

- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`

#### Test Structure

- Unit tests mock the GitHub API using MSW (Mock Service Worker) to test the application's behavior with both valid and invalid tokens
- E2E tests use a real GitHub token to verify the complete flow works as expected
- The token validation follows GitHub's format requirements and verifies tokens by making an API call

#### Writing Tests

When writing tests that involve the GitHub API:

1. **Unit Tests**:

   - Use MSW handlers in `src/mocks/handlers.ts`
   - Test both success and failure scenarios
   - Mock API responses appropriately

2. **E2E Tests**:
   - Require a valid GitHub token in the environment
   - Test real API interactions
   - Handle rate limiting and other API constraints
