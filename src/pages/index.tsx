import axios from "axios";
import { useEffect, useState } from "react";
import useSWR from "swr";

import GitHubTokenForm from "../components/github-token-form";

const fetcher = (url: string, token: string) =>
  axios
    .get(url, { headers: { Authorization: "Bearer " + token } })
    .then((res) => res.data);

function checkTokenFormat(token: string) {
  console.log("Checking token format!", token);
  const ret = token.length >= 40 && /^[a-z0-9_]+$/i.test(token);
  console.log("Token format is", ret);
  return ret;
}

export default function Home() {
  const [githubToken, setGitHubToken] = useState("");
  const [hasValidTokenFormat, setHasValidTokenFormat] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);

  const { data, error } = useSWR(
    hasValidTokenFormat ? ["https://api.github.com/user", githubToken] : null,
    ([url, token]) => fetcher(url, token),
  );

  useEffect(() => {
    console.log("Token changed!");
    setHasValidTokenFormat(checkTokenFormat(githubToken));
  }, [githubToken]);

  useEffect(() => {
    console.log("Data changed!", data, error);
    if (data) {
      setHasValidToken(true);
    } else if (error) {
      setHasValidToken(false);
    }
  }, [data, error]);

  return (
    <main className="flex flex-col items-center justify-center w-full flex-1 px-20">
      <h1 className="text-6xl font-bold">RepoRemover</h1>
      <p className="mt-3 text-2xl">
        The fastest way to archive or delete multiple GitHub repos
      </p>

      {hasValidToken ? (
        <div>
          <p>Valid token!</p>
          Hello {data?.login}!
        </div>
      ) : (
        <section className="mt-6 p-5 w-3/4">
          <a
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex px-2 py-1 mb-6 border-2 border-blue-500 p-2 text-blue-500"
            href="https://github.com/settings/tokens/new?scopes=delete_repo,repo&description=Repo%20Remover%20Token"
          >
            No token? Get one here!
          </a>

          <GitHubTokenForm
            className={"mt-2"}
            value={githubToken}
            onChange={setGitHubToken}
            onSubmit={(event) => {
              event.preventDefault();
              console.log("Submitted!");
            }}
          />
        </section>
      )}
    </main>
  );
}
