const Z_CLASS = /(^|\s)z-(?:\d+|\[\d+px\]|\[\d+\])(\s|$)/;
const ALLOWED_Z_CLASS = /z-\[var\(--z-/;

/** @type {import("eslint").Rule.RuleModule} */
export const noZIndexLiteral = {
  meta: {
    type: "problem",
    docs: { description: "z-index must use the named --z-* scale" },
    schema: [],
    messages: {
      literal: "Use a named --z-* token instead of a z-index literal.",
    },
  },
  create(context) {
    return {
      Property(node) {
        const name =
          node.key.type === "Identifier"
            ? node.key.name
            : node.key.type === "Literal"
              ? String(node.key.value)
              : "";
        if (name !== "zIndex" && name !== "z-index") {
          return;
        }
        if (node.value.type === "Literal" && typeof node.value.value === "number") {
          context.report({ node: node.value, messageId: "literal" });
        }
      },
      JSXAttribute(node) {
        if (node.name.name !== "className" || !node.value) {
          return;
        }
        if (node.value.type === "Literal" && typeof node.value.value === "string") {
          if (Z_CLASS.test(node.value.value) && !ALLOWED_Z_CLASS.test(node.value.value)) {
            context.report({ node, messageId: "literal" });
          }
        }
      },
    };
  },
};
