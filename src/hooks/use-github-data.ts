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

interface GitHubData {
  isError: boolean;
  isLoading: boolean;
  repos: null | Repository[];
  user: null | User;
}

interface RepositoriesResponse {
  user: {
    repositories: {
      nodes: Repository[];
      pageInfo: PageInfo;
    };
  } & User;
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
  const { login, pat } = useGitHub();

  const fetcher = async (): Promise<null | RepositoriesResponse> => {
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
    error,
    mutate,
  }: SWRResponse<null | RepositoriesResponse, Error> = useSWR(
    GET_REPOS,
    fetcher,
  );

  return {
    isError: pat && login && typeof error !== "undefined",
    isLoading: pat && login && !error && !data,
    mutate,
    repos: data?.user?.repositories?.nodes ?? null,
    user: data?.user ?? null,
  } as GitHubData;
}
