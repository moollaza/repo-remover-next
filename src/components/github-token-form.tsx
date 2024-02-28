"use client";

import clsx from "clsx";
import { ComponentProps } from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "react-aria-components";

type GitHubTokenFormProps = {
  className?: string;
  value: ComponentProps<typeof TextField>["value"];
  onChange: ComponentProps<typeof TextField>["onChange"];
  onSubmit: ComponentProps<typeof Form>["onSubmit"];
};

export default function GitHubTokenForm({
  className,
  value,
  onChange,
  onSubmit,
}: GitHubTokenFormProps) {
  return (
    <Form onSubmit={onSubmit} className={clsx("flex flex-col", className)}>
      <TextField
        value={value}
        onChange={onChange}
        name="personal-access-token"
        type="text"
        isRequired
        className={"flex flex-col mb-3 "}
        maxLength={40}
        minLength={40}
      >
        <Label className="mr-3 mb-2 font-semibold">
          Please enter your Personal Access Token
        </Label>
        <Input className={"border-2"} />
        <FieldError className={"mt-1 text-red-500"} />
      </TextField>
      <Button type="submit" className="mt-2 px-2 py-1 bg-gray-300">
        Submit
      </Button>
    </Form>
  );
}
