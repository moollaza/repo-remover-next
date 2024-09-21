import React, { useContext } from "react";
import GitHubTokenForm from "@components/github-token-form";
import GitHubContext from "@contexts/github-context";

const HomePage = () => {
  const { pat } = useContext(GitHubContext);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-5">Welcome</h1>
      {!pat && <GitHubTokenForm />}
    </div>
  );
};

export default HomePage;
