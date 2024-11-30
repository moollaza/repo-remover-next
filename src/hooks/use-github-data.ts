import { Octokit } from "@octokit/core";
import { PageInfo, Repository, User } from "@octokit/graphql-schema";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import useSWR, { SWRResponse } from "swr";

import { useGitHub } from "@providers/github-provider";

const MyOctokit = Octokit.plugin(paginateGraphQL);
const gql = String.raw;

export const GET_REPOS = gql`
  query GetRepos($cursor: String, $login: String!) {
    user(login: $login) {
      id
      name
      login
      avatarUrl
      bioHTML
      repositories(
        first: 100
        after: $cursor
        ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          viewerCanAdminister
          name
          description
          isFork
          isPrivate
          isArchived
          isTemplate
          isMirror
          isInOrganization
          isLocked
          isDisabled
          isEmpty
          updatedAt
          url
          parent {
            nameWithOwner
            url
          }
          owner {
            __typename
            login
            url
            ... on Organization {
              name
            }
          }
        }
      }
    }
  }
`;

interface RepositoriesResponse {
  user: User & {
    repositories: {
      nodes: Repository[];
      pageInfo: PageInfo;
    };
  };
}

interface GitHubData {
  user: User | null;
  repos: Repository[] | null;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Custom hook to fetch GitHub data using a personal access token (PAT) and login.
 *
 * @returns {GitHubData} An object containing user data, repositories, loading state, error state, and a mutate function.
 *
 * @example
 * const { user, repos, isLoading, isError, mutate } = useGitHubData();
 */
export default function useGitHubData(): GitHubData {
  const { pat, login } = useGitHub();

  const fetcher = async (): Promise<RepositoriesResponse | null> => {
    if (!pat || !login) {
      return null;
    }

    const octokit = new MyOctokit({ auth: pat });

    const data = await octokit.graphql.paginate<RepositoriesResponse>(
      GET_REPOS,
      {
        login,
      },
    );

    return data;
  };

  const {
    data,
    mutate,
    error,
  }: SWRResponse<RepositoriesResponse | null, Error> = useSWR(
    GET_REPOS,
    fetcher,
  );

  return {
    user: data?.user ?? null,
    repos: data?.user?.repositories?.nodes ?? null,
    isLoading: pat && login && !error && !data,
    isError: pat && login && typeof error !== "undefined",
    mutate,
  } as GitHubData;
}
