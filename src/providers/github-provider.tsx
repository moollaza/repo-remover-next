"use client";

import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

const MyOctokit = Octokit.plugin(throttling);
export type MyOctokitType = InstanceType<typeof MyOctokit>;

interface GitHubContextType {
  isLoading: boolean;
  login: null | string;
  octokit: MyOctokitType | null;
  pat: null | string;
  remember: boolean;
  setPat: (pat: null | string) => void;
  setRemember: (remember: boolean) => void;
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

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
  const [pat, setPat] = useState<null | string>(null);
  const [remember, setRemember] = useState(false);
  const [login, setLogin] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [octokit, setOctokit] = useState<MyOctokitType | null>(null);

  // Load PAT and login from localStorage on client mount
  useLayoutEffect(() => {
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
        setIsLoading(true);
        try {
          const response = await newOctokit.rest.users.getAuthenticated();

          if (response.data.login) {
            setLogin(response.data.login);
            setIsLoading(false);
          } else {
            console.error("No login found in response:", response.data);
            setLogin(null);
            setIsLoading(false);

            try {
              localStorage?.removeItem("pat");
            } catch (error) {
              console.error("Error removing PAT from localStorage:", error);
            }
          }
        } catch (error) {
          console.error("Error fetching GitHub login:", error);
          setLogin(null);
          setIsLoading(false);
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
      try {
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
      } catch (error) {
        console.error("Error persisting PAT and login to localStorage:", error);
      }
    }
  }, [pat, login, remember]);

  return (
    <GitHubContext.Provider
      value={{ isLoading, login, octokit, pat, remember, setPat, setRemember }}
    >
      {children}
    </GitHubContext.Provider>
  );
}

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
