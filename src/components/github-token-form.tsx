import axios from "axios";
import clsx from "clsx";
import { useContext, useEffect, useReducer, useState } from "react";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "react-aria-components";

import GitHubContext from "@contexts/github-context";

type State = "idle" | "invalid" | "validated";
type Action = { type: "validate"; isValid: boolean } | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "validate":
      return action.isValid ? "validated" : "invalid";
    case "reset":
      return "idle";
    default:
      throw new Error();
  }
}

async function getLogin(pat: string): Promise<string> {
  try {
    const response = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${pat}`,
      },
    });

    return response.data.login;
  } catch (error) {
    console.error("Error fetching user login:", error);
    return "";
  }
}

export default function GitHubTokenForm({ className }: { className?: string }) {
  const { pat, setPat, setLogin } = useContext(GitHubContext);
  const [value, setValue] = useState("");
  const [state, dispatch] = useReducer(reducer, "idle");

  function checkTokenFormat(token: string) {
    const ret = token.length >= 40 && /^[a-z0-9_]+$/i.test(token);
    return ret;
  }

  async function onSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (state === "validated") {
      setPat(value);

      const login = await getLogin(value);
      setLogin(login);
    }
  }

  useEffect(() => {
    const isValid = checkTokenFormat(value);
    dispatch({ type: "validate", isValid });
  }, [value]);

  return (
    <Form onSubmit={onSubmit} className={clsx("flex flex-col", className)}>
      <TextField
        value={value}
        onChange={setValue}
        name="personal-access-token"
        type="text"
        isRequired
        className={"flex flex-col mb-3 "}
        maxLength={40}
        minLength={40}
        autoComplete="off"
      >
        <Label className="mr-3 mb-2 font-semibold">
          Please enter your Personal Access Token
        </Label>
        <Input className={"border-2"} />
        {state === "invalid" && (
          <FieldError className={"mt-1 text-red-500"}>
            Invalid token format
          </FieldError>
        )}
      </TextField>
      <Button
        type="submit"
        isDisabled={state !== "validated"}
        className={clsx(
          "mt-2 px-2 py-1 bg-green-500 text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none",
          {},
        )}
      >
        Submit
      </Button>
    </Form>
  );
}
