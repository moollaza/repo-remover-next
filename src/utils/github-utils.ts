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

export const archiveRepo = async (
  octokit: MyOctokitType,
  repo: Repository,
): Promise<void> => {
  try {
    await octokit.rest.repos.update({
      owner: repo.owner.login,
      repo: repo.name,
      archived: true,
    });
  } catch (error) {
    throw new Error(
      `Failed to archive ${repo.name}: ${(error as Error).message}`,
    );
  }
};

export const deleteRepo = async (
  octokit: MyOctokitType,
  repo: Repository,
): Promise<void> => {
  try {
    await octokit.rest.repos.delete({
      owner: repo.owner.login,
      repo: repo.name,
    });
  } catch (error) {
    throw new Error(
      `Failed to delete ${repo.name}: ${(error as Error).message}`,
    );
  }
};

export const processRepo = async (
  octokit: MyOctokitType,
  repo: Repository,
  action: "archive" | "delete",
): Promise<void> => {
  if (action === "archive") {
    await archiveRepo(octokit, repo);
  } else if (action === "delete") {
    await deleteRepo(octokit, repo);
  }
};
