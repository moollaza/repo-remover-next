import type { Dispatch, SetStateAction } from "react";
import { createContext } from "react";

interface GitHubContextProps {
  pat: string | null;
  login: string | null;
  setPat: Dispatch<SetStateAction<string | null>>;
  setLogin: Dispatch<SetStateAction<string | null>>;
}

const GitHubContext = createContext<GitHubContextProps>({
  pat: null,
  login: null,
  setPat: () => {},
  setLogin: () => {},
});

export default GitHubContext;
