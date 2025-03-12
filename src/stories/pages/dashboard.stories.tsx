import type { Meta, StoryObj } from "@storybook/react";

import { GitHubDataDecorator, PageDecorator } from "@storybook/decorators";
import { mockRepos } from "@tests/fixtures/github-mocks";
import { http, HttpResponse } from "msw";

import DashboardPage from "@/app/dashboard/page";

const meta: Meta<typeof DashboardPage> = {
  component: DashboardPage,
  decorators: [PageDecorator, GitHubDataDecorator],
  parameters: {
    msw: {
      handlers: [
        http.post("https://api.github.com/graphql", () => {
          return HttpResponse.json({
            data: {
              user: {
                avatarUrl: "https://github.com/octocat.png",
                bioHTML: "<p>Octocat is a GitHub user</p>",
                login: "octocat",
                name: "Octocat",
                repositories: {
                  nodes: [
                    {
                      description: "Test repository 1",
                      id: "1",
                      isArchived: false,
                      isDisabled: false,
                      isFork: false,
                      isInOrganization: false,
                      isMirror: false,
                      isPrivate: true,
                      isTemplate: false,
                      name: "test-repo-1",
                      owner: {
                        login: "testuser",
                        updatedAt: "2024-02-26T00:00:00Z",
                        url: "https://github.com/testuser",
                      },
                      parent: {
                        name: "test-repo-1",
                        owner: {
                          login: "testuser",
                        },
                      },
                      updatedAt: "2024-02-26T00:00:00Z",
                      url: "https://github.com/testuser/test-repo-1",
                    },
                  ],

                  pageInfo: {
                    endCursor: "cursor2",
                    hasNextPage: false,
                  },
                },
              },
            },
          });
        }),
      ],
    },
  },
  title: "Pages/Dashboard",
};

export default meta;

type Story = StoryObj<typeof DashboardPage>;

export const Default: Story = {};
