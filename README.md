# Repo Remover

Bulk view, archive, and delete your GitHub repositories. Zero-knowledge — everything runs in your browser.

## Try it now at https://reporemover.xyz

<p>
  <img src="https://img.shields.io/github/license/moollaza/repo-remover.svg?style=flat-square" />
  <a href="https://reporemover.xyz">
    <img src="https://img.shields.io/website/https/reporemover.xyz.svg?style=flat-square" >
  </a>
</p>

## How it works

Repo Remover uses a [Personal Access Token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) with the GitHub API to list your repositories and make changes to them.

1. Provide a Personal Access Token
2. Select which repos to archive or delete
3. Review and confirm your changes

**Zero-knowledge architecture**: Your token never leaves your browser. No backend, no data collection, no cookies. All API calls are made client-side directly to GitHub.

**Note**: Tokens are not stored by default. If you opt-in to "Remember Me", your PAT is encrypted (AES-GCM) and stored in localStorage. For optimal security, create a new token each time and delete it when done.

## Run locally

1. Clone the repository
   ```bash
   git clone https://github.com/moollaza/repo-remover.git
   cd repo-remover
   ```
2. Install dependencies
   ```bash
   bun install
   ```
3. Start the dev server
   ```bash
   bun run dev
   ```
4. Visit http://localhost:5173

### Production build

```bash
bun run build
bun run preview
```

## Testing

```bash
bun run test:unit        # Unit tests (Vitest + RTL + MSW)
bun run test:e2e         # E2E tests (Playwright)
bun run test:e2e:fast    # E2E with fast-fail
bun run test:all         # Unit + E2E
```

## Built with

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [React Router](https://reactrouter.com/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) — testing
- [Sentry](https://sentry.io/) — privacy-first error monitoring
- [Fathom Analytics](https://usefathom.com/ref/E83PFO) — privacy-focused analytics ([public dashboard](https://app.usefathom.com/share/ikjnvhai/repo+remover))
- Deployed on [Cloudflare Workers](https://workers.cloudflare.com/)

## Author

Zaahir Moolla ([@zmoolla](https://bsky.app/profile/zmoolla.bsky.social), [zaahir.ca](https://zaahir.ca))
