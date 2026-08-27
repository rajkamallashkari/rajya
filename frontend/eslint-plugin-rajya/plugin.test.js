import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";
import plugin from "./index.js";

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 2022, sourceType: "module" },
  },
});

describe("eslint-plugin-rajya", () => {
  it("flags a raw button outside shared/ui", () => {
    tester.run("no-raw-button", plugin.rules["no-raw-button"], {
      valid: [
        {
          filename: "/src/shared/ui/button.tsx",
          code: "export function B() { return <button /> }",
        },
        { filename: "/src/shared/ui/icon.tsx", code: "export const n = 1" },
      ],
      invalid: [
        {
          filename: "/src/app/shell.tsx",
          code: "export function S() { return <button /> }",
          errors: [{ messageId: "raw" }],
        },
      ],
    });
  });

  it("flags hardcoded colours except in token files", () => {
    tester.run("no-hardcoded-hex", plugin.rules["no-hardcoded-hex"], {
      valid: [
        { filename: "/src/styles/tokens.css", code: "const x = '#fff'" },
        { filename: "/src/shared/lib/theme/constants.ts", code: "export const A = '#4F46E5'" },
        { filename: "/src/app/shell.tsx", code: "const x = 'var(--accent)'" },
        { filename: "/src/app/shell.test.tsx", code: "const x = '#fff'" },
        { filename: "/e2e/x.ts", code: "const x = '#fff'" },
        { filename: "/scripts/x.mjs", code: "const x = '#fff'" },
      ],
      invalid: [
        {
          filename: "/src/app/shell.tsx",
          code: "const x = '#ff00aa'",
          errors: [{ messageId: "hex" }],
        },
        {
          filename: "/src/app/shell.tsx",
          code: "const x = `rgb(1, 2, 3)`",
          errors: [{ messageId: "hex" }],
        },
      ],
    });
  });

  it("flags z-index literals", () => {
    tester.run("no-z-index-literal", plugin.rules["no-z-index-literal"], {
      valid: [
        { filename: "/src/app/shell.tsx", code: "const s = { zIndex: 'var(--z-modal)' }" },
        { filename: "/src/app/shell.tsx", code: "const s = { color: 1 }" },
        {
          filename: "/src/app/shell.tsx",
          code: `export function A() { return <div className={n} /> }`,
        },
        {
          filename: "/src/app/shell.tsx",
          code: `export function A() { return <div className="z-[var(--z-modal)]" /> }`,
        },
      ],
      invalid: [
        {
          filename: "/src/app/shell.tsx",
          code: "const s = { zIndex: 12 }",
          errors: [{ messageId: "literal" }],
        },
        {
          filename: "/src/app/shell.tsx",
          code: "const s = { 'z-index': 4 }",
          errors: [{ messageId: "literal" }],
        },
        {
          filename: "/src/app/shell.tsx",
          code: `export function A() { return <div className="z-50" /> }`,
          errors: [{ messageId: "literal" }],
        },
      ],
    });
  });

  it("flags user-facing copy", () => {
    tester.run("no-user-facing-string", plugin.rules["no-user-facing-string"], {
      valid: [
        {
          filename: "/src/app/shell.test.tsx",
          code: "export function A() { return <p>Hello</p> }",
        },
        { filename: "/src/app/shell.tsx", code: "export function A() { return <p>{label}</p> }" },
        {
          filename: "/src/app/shell.tsx",
          code: "export function A() { return <img alt={label} /> }",
        },
        { filename: "/e2e/theme-boot.spec.ts", code: "const copy = 'Hello'" },
        { filename: "/src/__tests__/x.tsx", code: "export function A() { return <p>Hello</p> }" },
        { filename: "/src/app/shell.tsx", code: "export function A() { return <div href='x' /> }" },
      ],
      invalid: [
        {
          filename: "/src/app/shell.tsx",
          code: "export function A() { return <p>Hello</p> }",
          errors: [{ messageId: "copy" }],
        },
        {
          filename: "/src/app/shell.tsx",
          code: `export function A() { return <img alt="Rajya" /> }`,
          errors: [{ messageId: "copy" }],
        },
      ],
    });
    expect(plugin.meta.name).toBe("eslint-plugin-rajya");
  });

  it("flags whole-store zustand subscriptions", () => {
    tester.run("no-whole-store-zustand", plugin.rules["no-whole-store-zustand"], {
      valid: [
        {
          filename: "/src/app/shell.tsx",
          code: "const open = useShellStore((s) => s.mobileNavOpen)",
        },
      ],
      invalid: [
        {
          filename: "/src/app/shell.tsx",
          code: "const all = useShellStore()",
          errors: [{ messageId: "whole" }],
        },
      ],
    });
  });
});
