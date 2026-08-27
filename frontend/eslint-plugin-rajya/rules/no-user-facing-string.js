const COPY_ATTRS = new Set([
  "alt",
  "title",
  "placeholder",
  "label",
  "aria-label",
  "aria-description",
]);
const LETTER = /\p{L}/u;

/** @type {import("eslint").Rule.RuleModule} */
export const noUserFacingString = {
  meta: {
    type: "problem",
    docs: { description: "User-facing copy must go through t()" },
    schema: [],
    messages: {
      copy: "User-facing strings belong in the catalog; use t().",
    },
  },
  create(context) {
    const filename = context.filename.replace(/\\/g, "/");
    if (
      filename.includes(".test.") ||
      filename.includes("/e2e/") ||
      filename.includes("/__tests__/")
    ) {
      return {};
    }
    return {
      JSXText(node) {
        if (LETTER.test(node.value)) {
          context.report({ node, messageId: "copy" });
        }
      },
      JSXAttribute(node) {
        const name = node.name.type === "JSXIdentifier" ? node.name.name : "";
        if (!COPY_ATTRS.has(name) || !node.value) {
          return;
        }
        if (
          node.value.type === "Literal" &&
          typeof node.value.value === "string" &&
          LETTER.test(node.value.value)
        ) {
          context.report({ node: node.value, messageId: "copy" });
        }
      },
    };
  },
};
