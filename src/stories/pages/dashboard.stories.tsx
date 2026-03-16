import type { Meta, StoryObj } from "@storybook/react";

import Dashboard from "@/components/dashboard";
import { MOCK_REPOS, MOCK_USER } from "@/mocks/static-fixtures";

const meta: Meta<typeof Dashboard> = {
  component: Dashboard,
  parameters: {
    chromatic: {
      modes: {
        dark: { theme: "dark" },
        light: { theme: "light" },
      },
    },
    layout: "fullscreen",
  },
  title: "Pages/Dashboard",
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

/** Default state with repositories loaded */
export const Default: Story = {
  args: {
    isError: false,
    isLoading: false,
    login: MOCK_USER.login,
    repos: MOCK_REPOS,
  },
};

/** Loading state while fetching repositories */
export const Loading: Story = {
  args: {
    isError: false,
    isLoading: true,
    login: MOCK_USER.login,
    repos: null,
  },
};

/** Error state when API call fails */
export const Error: Story = {
  args: {
    isError: true,
    isLoading: false,
    login: MOCK_USER.login,
    repos: null,
  },
};

/** Empty state with no repositories */
export const Empty: Story = {
  args: {
    isError: false,
    isLoading: false,
    login: MOCK_USER.login,
    repos: [],
  },
};

/** Partial data with permission warning */
export const PartialData: Story = {
  args: {
    isError: false,
    isLoading: false,
    login: MOCK_USER.login,
    permissionWarning:
      "Unable to access repositories from organization 'enterprise-corp' due to SAML SSO requirements.",
    repos: MOCK_REPOS.slice(0, 5),
  },
};

/** Large dataset simulation (100+ repositories) */
export const LargeDataset: Story = {
  args: {
    isError: false,
    isLoading: false,
    login: MOCK_USER.login,
    repos: Array.from({ length: 150 }, (_, i) => ({
      ...MOCK_REPOS[0],
      id: `repo-${i}`,
      name: `repository-${i}`,
    })),
  },
};

/** Loading with progress - personal repos stage */
export const LoadingPersonal: Story = {
  args: {
    isError: false,
    isLoading: true,
    login: MOCK_USER.login,
    progress: {
      currentOrg: undefined,
      orgsLoaded: 0,
      orgsTotal: 5,
      repos: [],
      stage: "personal",
      user: null,
    },
    repos: null,
  },
};

/** Loading with progress - orgs stage */
export const LoadingOrgs: Story = {
  args: {
    isError: false,
    isLoading: true,
    login: MOCK_USER.login,
    progress: {
      currentOrg: "acme-corp",
      orgsLoaded: 2,
      orgsTotal: 5,
      repos: MOCK_REPOS.slice(0, 50),
      stage: "orgs",
      user: MOCK_USER,
    },
    repos: MOCK_REPOS.slice(0, 50), // Some personal repos already loaded
  },
};

/** Progressive loading simulation - shows repos appearing */
export const ProgressiveLoading: Story = {
  args: {
    isError: false,
    isLoading: true,
    login: MOCK_USER.login,
    progress: {
      currentOrg: "tech-startup",
      orgsLoaded: 1,
      orgsTotal: 3,
      repos: MOCK_REPOS.slice(0, 20),
      stage: "orgs",
      user: MOCK_USER,
    },
    repos: MOCK_REPOS.slice(0, 20), // Partial data
  },
};