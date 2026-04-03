import { type Repository } from "@octokit/graphql-schema";

export interface LoadingProgress {
  currentOrg?: string;
  orgsLoaded: number;
  orgsTotal: number;
  repos: Repository[];
  stage: "complete" | "orgs" | "personal";
  user: null | User;
}

export interface User {
  avatarUrl: string;
  id: string;
  login: string;
  name: string;
  url: string;
}

export interface FetchResult {
  error: Error | null;
  permissionWarning?: string;
  repos: null | Repository[];
  samlProtectedOrgs?: string[];
  user: null | User;
}

export interface ScopeCheckResult {
  grantedScopes: string[];
  missingScopes: string[];
}
