"use client";

import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const MyOctokit = Octokit.plugin(throttling);
export type MyOctokitType = InstanceType<typeof MyOctokit>;

interface GitHubContextType {
  pat: string | null;
  setPat: (pat: string | null) => void;
  remember: boolean;
  setRemember: (remember: boolean) => void;
  login: string | null;
  isLoading: boolean;
  octokit: MyOctokitType | null;
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

/**
 * Hook to access the GitHub context. Provides access to the PAT, login, and Octokit instance.
 *
 * @example
 * const { pat, login, isLoading } = useGitHub();
 *
 * @returns {GitHubContextType} The GitHub context value.
 * @throws {Error} If the hook is used outside of a `GitHubProvider`.
 * @note This hook must be used within a `GitHubProvider`.
 */
export function useGitHub() {
  const context = useContext(GitHubContext);
  if (!context) {
    throw new Error("useGitHub must be used within a GitHubProvider");
  }
  return context;
}

/**
 * Provides GitHub authentication and context
 *
 * This component handles the following:
 * - Loading the Personal Access Token (PAT) and login from localStorage on client mount.
 * - Creating and setting the Octokit instance when the PAT changes.
 * - Fetching the authenticated user's login using the Octokit instance.
 * - Persisting the PAT and login to localStorage based on the `remember` state.
 */
export default function GitHubProvider({ children }: { children: ReactNode }) {
  const [pat, setPat] = useState<string | null>(null);
  const [remember, setRemember] = useState<boolean>(true);
  const [login, setLogin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [octokit, setOctokit] = useState<MyOctokitType | null>(null);

  // Load PAT and login from localStorage on client mount
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const storedPat = localStorage.getItem("pat");
      const storedLogin = localStorage.getItem("login");

      setIsLoading(false);

      if (storedPat) {
        setPat(storedPat);
      }

      if (storedLogin) {
        setLogin(storedLogin);
      }
    }
  }, []);

  // Create and set the Octokit instance when the PAT changes
  useEffect(() => {
    if (pat) {
      const newOctokit = new MyOctokit({
        auth: pat,
        throttle: {
          onRateLimit: (retryAfter, options, octokit, retryCount) => {
            octokit.log.warn(
              `Request quota exhausted for request ${options.method} ${options.url}`,
            );

            if (retryCount < 3) {
              // retries a request three times
              octokit.log.info(`Retrying after ${retryAfter} seconds!`);
              return true;
            }
          },
          onSecondaryRateLimit: (retryAfter, options, octokit) => {
            // does not retry, only logs a warning
            octokit.log.warn(
              `SecondaryRateLimit detected for request ${options.method} ${options.url}`,
            );
          },
        },
      });
      setOctokit(newOctokit);

      const fetchLogin = async (): Promise<void> => {
        try {
          const response = await newOctokit.rest.users.getAuthenticated();

          if (response.data.login) {
            setLogin(response.data.login);
          } else {
            console.error("No login found in response:", response.data);
            setLogin(null);
          }
        } catch (error) {
          console.error("Error fetching login:", error);
          setLogin(null);
        }
      };

      void fetchLogin();
    } else {
      setOctokit(null);
    }
  }, [pat]);

  // Persist PAT and login to localStorage
  useEffect(() => {
    if (remember && typeof localStorage !== "undefined") {
      if (pat) {
        localStorage.setItem("pat", pat);
      } else {
        localStorage.removeItem("pat");
      }

      if (login) {
        localStorage.setItem("login", login);
      } else {
        localStorage.removeItem("login");
      }
    }
  }, [pat, login, remember]);

  return (
    <GitHubContext.Provider
      value={{ pat, setPat, remember, setRemember, login, isLoading, octokit }}
    >
      {children}
    </GitHubContext.Provider>
  );
}
