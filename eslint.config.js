import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginPrettier from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
    plugins: {
      js,
      react: pluginReact,
      prettier: pluginPrettier,
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      "prettier/prettier": "error",
      // Ignore warnings from external packages we can't control
      "react-hooks/exhaustive-deps": "warn",
      "react/prop-types": "off"
    },
    settings: {
      react: { version: "detect" },
    },
    ignores: [
      "node_modules/**",
      "dist/**", 
      "build/**",
      "coverage/**"
    ]
  },
]);