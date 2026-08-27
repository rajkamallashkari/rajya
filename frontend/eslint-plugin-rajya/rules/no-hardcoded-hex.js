const HEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
const FUNC = /\b(?:rgb|rgba|hsl|hsla)\(/i;
const TOKEN_FILE = /(?:tokens\.css|theme\/constants\.ts)$/;

function isAllowedFile(filename) {
  const normalized = filename.replace(/\\/g, "/");
  if (TOKEN_FILE.test(normalized)) {
    return true;
  }
  return (
    normalized.includes(".test.") ||
    normalized.includes("/e2e/") ||
    normalized.includes("/scripts/")
  );
}

/** @type {import("eslint").Rule.RuleModule} */
export const noHardcodedHex = {
  meta: {
    type: "problem",
    docs: { description: "Hex and functional colour notations only belong in the token file" },
    schema: [],
    messages: {
      hex: "Hardcoded colours belong in src/styles/tokens.css.",
    },
  },
  create(context) {
    if (isAllowedFile(context.filename)) {
      return {};
    }
    const check = (node, value) => {
      if (typeof value === "string" && (HEX.test(value) || FUNC.test(value))) {
        context.report({ node, messageId: "hex" });
      }
    };
    return {
      Literal(node) {
        check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
    };
  },
};
