const STORE_HOOK = /^use\w*Store$/;

/** @type {import("eslint").Rule.RuleModule} */
export const noWholeStoreZustand = {
  meta: {
    type: "problem",
    docs: { description: "Subscribe to Zustand with a selector, never the whole store" },
    schema: [],
    messages: {
      whole: "Do not subscribe to a whole Zustand store. Pass a selector.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || !STORE_HOOK.test(node.callee.name)) {
          return;
        }
        if (node.arguments.length === 0) {
          context.report({ node, messageId: "whole" });
        }
      },
    };
  },
};
