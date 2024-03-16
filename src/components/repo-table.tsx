import React from "react";

import type { Repository } from "@hooks/use-github-data";

export default function RepoTable({ repos }: { repos: Repository[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {repos.map((repo: Repository) => (
          <tr key={repo.id}>
            <td>{repo.name}</td>
            <td>{repo.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
