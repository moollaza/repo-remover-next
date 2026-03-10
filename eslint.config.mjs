import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    globalIgnores(["**/node_modules/", "**/.next/", "**/.vscode/", "**/out/"]),
    {
        extends: compat.extends(
            "eslint:recommended",
            "plugin:@typescript-eslint/recommended-type-checked",
            "plugin:@typescript-eslint/stylistic-type-checked",
            "next/core-web-vitals",
            "prettier",
            "plugin:perfectionist/recommended-alphabetical-legacy",
        ),

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 5,
            sourceType: "script",

            parserOptions: {
                project: "./tsconfig.json",
            },
        },

        rules: {
            "perfectionist/sort-imports": ["error", {
                internalPattern: [
                    "@/.+",
                    "@/components/.+",
                    "@/contexts/.+",
                    "@/graphql/.+",
                    "@/hooks/.+",
                    "@/providers/.+",
                    "@/utils/.+",
                ],
            }],
        },
    },
    {
        files: [
            "**/*.test.ts",
            "**/*.test.tsx",
            "**/__tests__/**/*.ts",
            "**/__tests__/**/*.tsx",
        ],

        rules: {
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-call": "off",
        },
    },
]);