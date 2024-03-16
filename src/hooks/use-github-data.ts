import { Octokit } from "@octokit/core";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import useSWR from "swr";

const gql = String.raw;

const GET_REPOS = gql`
  query GetRepos($cursor: String, $login: String!) {
    user(login: $login) {
      repositories(
        first: 100
        after: $cursor
        ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
      ) {
        nodes {
          id
          name
          description
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export interface Repository {
  id: string;
  name: string;
  description: string;
}

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

  const MyOctokit = Octokit.plugin(paginateGraphQL);
  const octokit = new MyOctokit({ auth: pat });

  console.log("useGitHubData", { pat, login });
  const fetcher = () => {
    return octokit.graphql.paginate(GET_REPOS, { login });
  };

  const { data, error } = useSWR(GET_REPOS, fetcher);

  console.log(data, error);

  return {
    repos: data?.user?.repositories?.nodes,
    isLoading: !error && !data,
    isError: error,
  };
}
