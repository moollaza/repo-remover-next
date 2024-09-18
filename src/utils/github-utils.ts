import { faker } from "@faker-js/faker";
import { Repository } from "@octokit/graphql-schema";
import { Octokit } from "@octokit/rest";

export async function generateRepos(
  octokit: Octokit,
  setLoading: (loading: boolean) => void,
): Promise<void> {
  console.log("Generating random repos...");
  setLoading(true);

  try {
    for (let i = 0; i < 10; i++) {
      console.log(`Creating repo ${i + 1}...`);
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

