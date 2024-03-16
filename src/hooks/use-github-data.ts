import { Octokit } from "@octokit/core";
import { Repository, User } from "@octokit/graphql-schema";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import useSWR from "swr";

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

export interface RepoData {
  repositories: {
    nodes: Repository[];
  };
}

export default function useGitHubData({
  pat,
  login,
}: {
  pat: string | null;
  login: string | null;
}) {
  if (!pat || !login) {
    return {
      repos: null,
      isLoading: false,
      isError: false,
    };
  }

  const octokit = new MyOctokit({ auth: pat });

  const fetcher = async () => {
    const data = await octokit.graphql.paginate<{
      user: User;
    }>(GET_REPOS, {
      login,
    });

    console.log(data);

    return data;
  };

  const { data, error } = useSWR(GET_REPOS, fetcher);

  return {
    repos: data?.user?.repositories?.nodes,
    isLoading: !error && !data,
    isError: error,
  };
}
