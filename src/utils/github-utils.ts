import { faker } from "@faker-js/faker";
import { type Repository } from "@octokit/graphql-schema";
import { type MyOctokitType } from "@providers/github-provider";

const DEBUG = false;

export async function generateRepos(
  octokit: MyOctokitType,
  setLoading: (loading: boolean) => void,
  numberOfRepos = 10,
): Promise<void> {
  DEBUG && console.log("Generating random repos...");
  setLoading(true);

  try {
    for (let i = 0; i < numberOfRepos; i++) {
      DEBUG && console.log(`Creating repo ${i + 1}...`);
      await octokit.rest.repos.createForAuthenticatedUser({
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        homepage: faker.internet.url(),
        private: faker.datatype.boolean(),
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error("Error generating repos:", error);
  } finally {
    setLoading(false);
  }
}

async function processRepos(
  octokit: MyOctokitType,
  repos: Repository[],
  setProgress: (progress: number) => void,
  processRepo: (octokit: MyOctokitType, repo: Repository) => Promise<void>,
  actionName: string,
): Promise<void> {
  DEBUG && console.log(`${actionName} repos...`);

  try {
    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];
      DEBUG && console.log(`${actionName} repo ${repo.name}...`);

      try {
        await processRepo(octokit, repo);
      } catch (error) {
        console.error(
          `Error ${actionName.toLowerCase()} repo ${repo.name}:`,
          error,
        );
      }

      setProgress(i + 1);

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } finally {
    // todo
  }
}

export async function deleteRepos(
  octokit: MyOctokitType,
  repos: Repository[],
  setProgress: (progress: number) => void,
): Promise<void> {
  await processRepos(
    octokit,
    repos,
    setProgress,
    async (octokit, repo) => {
      await octokit.rest.repos.delete({
        owner: repo.owner.login,
        repo: repo.name,
      });
    },
    "Deleting",
  );
}

export async function archiveRepos(
  octokit: MyOctokitType,
  repos: Repository[],
  setProgress: (progress: number) => void,
): Promise<void> {
  await processRepos(
    octokit,
    repos,
    setProgress,
    async (octokit, repo) => {
      await octokit.rest.repos.update({
        owner: repo.owner.login,
        repo: repo.name,
        archived: true,
      });
    },
    "Archiving",
  );
}
