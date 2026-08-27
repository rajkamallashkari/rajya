const BUTTON = "button";
const SHARED_UI = `${"shared"}/ui`;

/** @type {import("eslint").Rule.RuleModule} */
export const noRawButton = {
  meta: {
    type: "problem",
    docs: { description: "Raw button elements are only allowed in shared/ui" },
    schema: [],
    messages: {
      raw: "Raw <button> is only allowed in shared/ui. Use the Button primitive.",
    },
  },
  create(context) {
    const filename = context.filename.replace(/\\/g, "/");
    if (filename.includes(`/${SHARED_UI}/`) || filename.includes(`/${SHARED_UI}.`)) {
      return {};
    }
    return {
      JSXOpeningElement(node) {
        if (node.name.type === "JSXIdentifier" && node.name.name === BUTTON) {
          context.report({ node, messageId: "raw" });
        }
      },
    };
  },
};
