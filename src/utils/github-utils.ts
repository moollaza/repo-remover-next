import { faker } from "@faker-js/faker";
import { type Repository } from "@octokit/graphql-schema";
import { type Octokit } from "@octokit/rest";

const DEBUG = false;

export async function generateRepos(
  octokit: Octokit,
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

export async function deleteRepos(
  octokit: Octokit,
  repos: Repository[],
  setLoading: (loading: boolean) => void,
): Promise<void> {
  DEBUG && console.log("Deleting repos...");
  setLoading(true);

  try {
    for (const repo of repos) {
      DEBUG && console.log(`Deleting repo ${repo.name}...`);

      await octokit.rest.repos.delete({
        owner: repo.owner.login,
        repo: repo.name,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error("Error deleting repos:", error);
  } finally {
    setLoading(false);
  }
}

export async function archiveRepos(
  octokit: Octokit,
  repos: Repository[],
  setLoading: (loading: boolean) => void,
): Promise<void> {
  DEBUG && console.log("Archiving repos...");
  setLoading(true);

  try {
    for (const repo of repos) {
      DEBUG && console.log(`Archiving repo ${repo.name}...`);

      await octokit.rest.repos.update({
        owner: repo.owner.login,
        repo: repo.name,
        archived: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error("Error archiving repos:", error);
  } finally {
    setLoading(false);
  }
}
