"use client";

import axios from "axios";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Define an interface for the GitHub user response
interface GitHubUser {
  login: string;
}

// Define the context value type
interface GitHubContextType {
  pat: string | null;
  setPat: (pat: string | null) => void;
  login: string | null;
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export const useGitHub = (): GitHubContextType => {
  const context = useContext(GitHubContext);
  if (!context) {
    throw new Error("useGitHub must be used within a GitHubProvider");
  }
  return context;
};

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
                Authorization: `token ${pat}`,
              },
            },
          );

          setLogin(response.data.login);
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
