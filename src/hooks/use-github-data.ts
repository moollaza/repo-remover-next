import { Octokit } from "@octokit/core";
import { PageInfo, Repository, User } from "@octokit/graphql-schema";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import useSWR, { SWRResponse } from "swr";

const MyOctokit = Octokit.plugin(paginateGraphQL);
const gql = String.raw;

const GET_REPOS = gql`
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
          updatedAt
          url
          parent {
            nameWithOwner
            url
          }
          owner {
            login
            url
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

interface UseGitHubDataArgs {
  pat: string | null;
  login: string | null;
}

export default function useGitHubData({
  pat,
  login,
}: UseGitHubDataArgs): GitHubData {
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

  const { data, error }: SWRResponse<RepositoriesResponse | null, Error> =
    useSWR(GET_REPOS, fetcher);

  return {
    user: data?.user ?? null,
    repos: data?.user?.repositories?.nodes ?? null,
    isLoading: !error && !data,
    isError: !!error,
  } as GitHubData;
}
