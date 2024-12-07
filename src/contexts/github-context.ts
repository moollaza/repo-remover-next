import type { Dispatch, SetStateAction } from "react";

import { createContext } from "react";

interface GitHubContextProps {
  login: null | string;
  pat: null | string;
  setPat: Dispatch<SetStateAction<null | string>>;
}

const GitHubContext = createContext<GitHubContextProps>({
  login: null,
  pat: null,
  setPat: () => {
    // do nothing
  },
});

export default GitHubContext;
