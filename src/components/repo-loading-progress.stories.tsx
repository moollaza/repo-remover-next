import type { Meta, StoryObj } from "@storybook/react";

import RepoLoadingProgress from "@/components/repo-loading-progress";

const meta: Meta<typeof RepoLoadingProgress> = {
  component: RepoLoadingProgress,
  parameters: {
    layout: "padded",
  },
  title: "Components/RepoLoadingProgress",
};

export default meta;
type Story = StoryObj<typeof RepoLoadingProgress>;

/** Loading personal repositories (stage 1) */
export const PersonalRepos: Story = {
  args: {
    orgsLoaded: 0,
    orgsTotal: 5,
    stage: "personal",
  },
};

/** Loading org repositories - first org */
export const FirstOrg: Story = {
  args: {
    currentOrg: "acme-corp",
    orgsLoaded: 1,
    orgsTotal: 5,
    stage: "orgs",
  },
};

/** Loading org repositories - mid progress */
export const MidProgress: Story = {
  args: {
    currentOrg: "big-tech-company",
    orgsLoaded: 3,
    orgsTotal: 5,
    stage: "orgs",
  },
};

/** Loading org repositories - almost done */
export const AlmostComplete: Story = {
  args: {
    currentOrg: "open-source-foundation",
    orgsLoaded: 4,
    orgsTotal: 5,
    stage: "orgs",
  },
};

/** Complete stage (should auto-dismiss - renders nothing) */
export const Complete: Story = {
  args: {
    orgsLoaded: 5,
    orgsTotal: 5,
    stage: "complete",
  },
};

/** Single org user */
export const SingleOrg: Story = {
  args: {
    currentOrg: "startup-inc",
    orgsLoaded: 0,
    orgsTotal: 1,
    stage: "orgs",
  },
};

/** Many orgs user */
export const ManyOrgs: Story = {
  args: {
    currentOrg: "enterprise-division-7",
    orgsLoaded: 8,
    orgsTotal: 15,
    stage: "orgs",
  },
};
