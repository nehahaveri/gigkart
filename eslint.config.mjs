import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Exclude compiled third-party code
    "node_modules/**",
  ]),
  {
    rules: {
      // React 18 auto-batches synchronous setState calls in effects — no cascading renders
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

export default eslintConfig;
