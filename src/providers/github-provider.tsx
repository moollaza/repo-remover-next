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
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

/**
 * Custom hook that provides access to the GitHub context.
 * @returns The GitHub context.
 * @throws {Error} If used outside of a GitHubProvider.
 */
export const useGitHub = (): GitHubContextType => {
  const context = useContext(GitHubContext);
  if (!context) {
    throw new Error("useGitHub must be used within a GitHubProvider");
  }
  return context;
};

/**
 * Provider component that wraps the application and provides the GitHub context.
 * @param children The child elements to render.
 * @returns The GitHub context provider.
 */
export default function GitHubProvider({ children }: { children: ReactNode }) {
  const [pat, setPat] = useState<string | null>(
    typeof localStorage !== "undefined" ? localStorage.getItem("pat") : null,
  );

  const [login, setLogin] = useState<string | null>(
    typeof localStorage !== "undefined" ? localStorage.getItem("login") : null,
  );

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
            throw new Error("[Error] Unable to fetch login");
            // Reset login on error
            setLogin(null);
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error("Error fetching login:", error.message);
          } else {
            console.error("Unexpected error:", error);
          }
          // Reset login on error
          setLogin(null);
        }
      };

      void fetchLogin();
    } else {
      // Reset login if PAT is empty
      setLogin(null);
    }
  }, [pat]);

  // Persist PAT and login in localStorage
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pat", pat ?? "");
      localStorage.setItem("login", login ?? "");
    }
  }, [pat, login]);

  return (
    <GitHubContext.Provider value={{ pat, setPat, login }}>
      {children}
    </GitHubContext.Provider>
  );
}
