"use client";

import axios from "axios";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface GitHubUser {
  login: string;
}

interface GitHubContextType {
  pat: string | null;
  setPat: (pat: string | null) => void;
  login: string | null;
  isLoading: boolean;
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

  // Fetch the login information when the PAT changes
  useEffect(() => {
    if (pat) {
      const fetchLogin = async (): Promise<void> => {
        try {
          const response = await axios.get<GitHubUser>(
            "https://api.github.com/user",
            {
              headers: {
                Authorization: `Bearer ${pat}`,
                "X-GitHub-Api-Version": "2022-11-28",
              },
            },
          );

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
    <GitHubContext.Provider value={{ pat, setPat, login, isLoading }}>
      {children}
    </GitHubContext.Provider>
  );
}
