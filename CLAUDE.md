# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production version
- `npm start` - Start production server

### Testing

- `npm test` - Run unit tests with Vitest in watch mode
- `npm run test:unit` - Run unit tests once
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run debug:e2e` - Debug E2E tests
- `npm run test:all` - Run both unit and E2E tests

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix

### Storybook

- `npm run storybook` or `npm run sb` - Start Storybook on port 6006
- `npm run build-storybook` - Build Storybook for production

## Architecture Overview

This is a Next.js application for managing GitHub repositories with the following key architectural patterns:

### Core Data Flow

- **GitHub API Integration**: Uses Octokit with GraphQL to fetch user and organization repositories
- **State Management**: React Context (`GitHubContext`) provides authentication state and repository data across components
- **Data Fetching**: SWR for caching and revalidation of GitHub API calls
- **Authentication**: GitHub Personal Access Token (PAT) based authentication

### Key Components Structure

- **Data Provider Layer**: `GitHubDataProvider` wraps the app and manages API calls and state
- **Context Layer**: `GitHubContext` provides typed access to user data, repositories, and authentication state
- **Component Layer**: Reusable UI components built with HeroUI and Tailwind CSS
- **Testing Layer**: MSW (Mock Service Worker) for unit tests, real API calls for E2E tests

### GitHub API Integration

- **Personal Repos**: Fetches user's personal repositories
- **Organization Repos**: Fetches repositories from all organizations user belongs to
- **Pagination**: Handles GraphQL pagination for large datasets
- **Error Handling**: Supports partial data loading when some API calls fail (e.g., SSO-protected orgs)

### Testing Strategy

- **Unit Tests**: Use MSW to mock GitHub API responses in `src/mocks/handlers.ts`
- **E2E Tests**: Require real GitHub token in `.env.test` file (`GITHUB_TEST_TOKEN`)
- **Storybook**: Component documentation and visual testing

### File Organization

- `src/app/` - Next.js app router pages and layouts
- `src/components/` - Reusable UI components with co-located stories and tests
- `src/contexts/` - React contexts for state management
- `src/providers/` - Data providers and higher-order components
- `src/utils/` - Utility functions including GitHub API helpers
- `src/mocks/` - MSW handlers and test fixtures

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **UI Library**: HeroUI (NextUI fork) with Tailwind CSS
- **Testing**: Vitest + React Testing Library + Playwright
- **API Client**: Octokit (GitHub API)
- **State Management**: React Context + SWR
- **Styling**: Tailwind CSS with dark mode support

## Important Development Guidelines

**ALWAYS check the relevant documentation before making changes to ensure you're following current best practices and using the correct APIs.**

**ALWAYS run relevant test when making changes to validate they are correct.**

## Documentation Links

### Core Framework & Libraries

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev/reference/react
- **TypeScript**: https://www.typescriptlang.org/docs/

### UI & Styling

- **HeroUI (NextUI)**: https://heroui.com/docs/guide/introduction
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion/

### Testing

- **Vitest**: https://vitest.dev/guide/
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Playwright**: https://playwright.dev/docs/intro
- **MSW (Mock Service Worker)**: https://mswjs.io/docs/
- **Storybook**: https://storybook.js.org/docs

### GitHub API & Data Fetching

- **Octokit**: https://github.com/octokit/octokit.js
- **GitHub GraphQL API**: https://docs.github.com/en/graphql
- **SWR**: https://swr.vercel.app/docs/getting-started

### Development Tools

- **ESLint**: https://eslint.org/docs/latest/
- **Prettier**: https://prettier.io/docs/en/
- **Vite**: https://vitejs.dev/guide/
