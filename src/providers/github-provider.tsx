"use client";

import { Octokit } from "@octokit/rest";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface GitHubContextType {
  pat: string | null;
  setPat: (pat: string | null) => void;
  login: string | null;
  isLoading: boolean;
  octokit: Octokit | null;
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export function useGitHub(): GitHubContextType {
  const context = useContext(GitHubContext);
  if (!context) {
    throw new Error("useGitHub must be used within a GitHubProvider");
  }
  return context;
}

export default function GitHubProvider({ children }: { children: ReactNode }) {
  const [pat, setPat] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [octokit, setOctokit] = useState<Octokit | null>(null);

  // Load PAT and login from localStorage on client mount
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const storedPat = localStorage.getItem("pat");
      const storedLogin = localStorage.getItem("login");

      setPat(storedPat);
      setLogin(storedLogin);
      setIsLoading(false);
    }
  }, []);

  // Create and set the Octokit instance when the PAT changes
  useEffect(() => {
    if (pat) {
      const newOctokit = new Octokit({
        auth: pat,
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

  // Persist PAT and login in localStorage
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      if (pat) {
        localStorage.setItem("pat", pat);
      }

      if (login) {
        localStorage.setItem("login", login);
      }
    }
  }, [pat, login]);

  return (
    <GitHubContext.Provider value={{ pat, setPat, login, isLoading, octokit }}>
      {children}
    </GitHubContext.Provider>
  );
}
