import { type Repository } from "@octokit/graphql-schema";
import { type Octokit } from "@octokit/rest";

import { analytics } from "@/utils/analytics";
import { debug } from "@/utils/debug";

export const archiveRepo = async (
  octokit: Octokit,
  repo: Repository,
): Promise<void> => {
  try {
    await octokit.rest.repos.update({
      archived: true,
      owner: repo.owner.login,
      repo: repo.name,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    debug.error(errorMessage);
    throw new Error(
      `Failed to archive ${repo.name}: ${(error as Error).message}`,
    );
  }
};

export const deleteRepo = async (
  octokit: Octokit,
  repo: Repository,
): Promise<void> => {
  try {
    await octokit.rest.repos.delete({
      owner: repo.owner.login,
      repo: repo.name,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    debug.error(errorMessage);
    throw new Error(
      `Failed to delete ${repo.name}: ${(error as Error).message}`,
    );
  }
};

export const processRepo = async (
  octokit: Octokit,
  repo: Repository,
  action: "archive" | "delete",
): Promise<void> => {
  if (!octokit) {
    throw new Error("Octokit instance is required");
  }

  if (!repo) {
    throw new Error("Repository is required");
  }

  if (!action) {
    throw new Error("Action is required");
  }

  debug.log(`Processing ${action} for ${repo.name}...`);

  if (action === "archive") {
    await archiveRepo(octokit, repo);
    analytics.trackRepoArchived();
  } else {
    await deleteRepo(octokit, repo);
    analytics.trackRepoDeleted();
  }
};
