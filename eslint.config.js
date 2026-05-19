import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-empty-object-type": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // === AI regression guardrails (banned libraries) ===
      // See CLAUDE.md §7. Use date-fns / fetch / native ES instead.
      "no-restricted-imports": ["error", {
        paths: [
          { name: "moment", message: "Use date-fns 3 instead (project provides useDateLocale wrapper)." },
          { name: "axios", message: "Use supabase-js in client + native fetch in edge functions." },
          { name: "lodash", message: "Use native ES or lodash-es with deep import paths only." },
          { name: "openai", message: "Route AI calls through the Lovable AI Gateway edge function." },
          { name: "@anthropic-ai/sdk", message: "Route AI calls through the Lovable AI Gateway edge function." },
        ],
        patterns: [
          { group: ["lodash/*"], message: "Prefer native ES; if needed, use lodash-es with deep import paths." },
        ],
      }],
    },
  },
  // Auto-generated files — do not edit. ESLint should not warn nor be used to
  // "improve" them. Keep rules minimal here.
  {
    files: ["src/integrations/supabase/**/*.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Test files: relaxed.
  {
    files: ["src/**/*.{test,spec}.{ts,tsx}", "src/test/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
