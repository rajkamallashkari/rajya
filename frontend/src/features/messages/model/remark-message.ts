import { gfmAutolinkLiteral } from "micromark-extension-gfm-autolink-literal";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { gfmAutolinkLiteralFromMarkdown } from "mdast-util-gfm-autolink-literal";
import { gfmStrikethroughFromMarkdown } from "mdast-util-gfm-strikethrough";
import type { Blockquote, PhrasingContent, Root } from "mdast";
import type { Plugin } from "unified";
import { CONTINUE, visit } from "unist-util-visit";
import { DISABLED_MARKDOWN_CONSTRUCTS } from "./constants";

const SKIP_INLINE_PARENTS = new Set(["code", "inlineCode", "link", "mention", "spoiler"]);

const SPOILER_RE = /\|\|(.*?)\|\|/g;
const SPECIAL_MENTION_RE = /<@(everyone|admins)>|(^|\s)@(everyone|admins)\b/g;
const MENTION_RE = /(^|\s)@(?!everyone\b|admins\b)([A-Za-z][\w.]{0,31})\b/g;

interface DataBag {
  micromarkExtensions?: unknown[];
  fromMarkdownExtensions?: unknown[];
}

function addExtension(data: DataBag, field: keyof DataBag, value: unknown): void {
  const list = data[field] ?? [];
  data[field] = list;
  list.push(value);
}

function flattenBlockquote(node: Blockquote): void {
  const next: Blockquote["children"] = [];
  for (const child of node.children) {
    if (child.type === "blockquote") {
      flattenBlockquote(child);
      next.push(...child.children);
    } else {
      next.push(child);
    }
  }
  node.children = next;
}

function splitSpoilers(value: string): PhrasingContent[] {
  const nodes: PhrasingContent[] = [];
  const re = new RegExp(SPOILER_RE.source, "g");
  let last = 0;
  let match = re.exec(value);
  while (match) {
    if (match.index > last) {
      nodes.push({ type: "text", value: value.slice(last, match.index) });
    }
    nodes.push({
      type: "spoiler",
      children: [{ type: "text", value: match[1] || "" }],
    } as unknown as PhrasingContent);
    last = match.index + match[0].length;
    match = re.exec(value);
  }
  if (nodes.length === 0) {
    return [{ type: "text", value }];
  }
  if (last < value.length) {
    nodes.push({ type: "text", value: value.slice(last) });
  }
  return nodes;
}

function mentionNode(handle: string): PhrasingContent {
  return {
    type: "mention",
    handle,
    children: [{ type: "text", value: `@${handle}` }],
  } as unknown as PhrasingContent;
}

function splitSpecialMentions(value: string): PhrasingContent[] {
  const nodes: PhrasingContent[] = [];
  const re = new RegExp(SPECIAL_MENTION_RE.source, "g");
  let last = 0;
  let match = re.exec(value);
  while (match) {
    const handle = (match[1] || match[3]) as string;
    const prefix = match[2] || "";
    if (match.index > last) {
      nodes.push({ type: "text", value: value.slice(last, match.index) });
    }
    if (!match[1] && prefix) {
      nodes.push({ type: "text", value: prefix });
    }
    nodes.push(mentionNode(handle));
    last = match.index + match[0].length;
    match = re.exec(value);
  }
  if (nodes.length === 0) {
    return [{ type: "text", value }];
  }
  if (last < value.length) {
    nodes.push({ type: "text", value: value.slice(last) });
  }
  return nodes;
}

function splitHandleMentions(value: string): PhrasingContent[] {
  const nodes: PhrasingContent[] = [];
  const re = new RegExp(MENTION_RE.source, "g");
  let last = 0;
  let match = re.exec(value);
  while (match) {
    const prefix = match[1] || "";
    const handle = match[2] as string;
    const atIndex = match.index + prefix.length;
    if (match.index > last) {
      nodes.push({ type: "text", value: value.slice(last, match.index) });
    }
    if (prefix) {
      nodes.push({ type: "text", value: prefix });
    }
    nodes.push(mentionNode(handle));
    last = atIndex + handle.length + 1;
    match = re.exec(value);
  }
  if (nodes.length === 0) {
    return [{ type: "text", value }];
  }
  if (last < value.length) {
    nodes.push({ type: "text", value: value.slice(last) });
  }
  return nodes;
}

function splitMentions(value: string): PhrasingContent[] {
  return splitSpecialMentions(value).flatMap((part) =>
    part.type === "text" ? splitHandleMentions(part.value) : [part],
  );
}

function rewriteText(
  tree: Root,
  splitter: (value: string) => PhrasingContent[],
  skip: ReadonlySet<string>,
): void {
  visit(tree, "text", (node, index, parent) => {
    if (parent === undefined || index === undefined || skip.has(parent.type)) {
      return;
    }
    const parts = splitter(node.value);
    if (parts.length === 1 && parts[0]?.type === "text") {
      return;
    }
    parent.children.splice(index, 1, ...(parts as typeof parent.children));
    return [CONTINUE, index + parts.length];
  });
}

export const remarkMessageMarkdown: Plugin<[], Root> = function remarkMessageMarkdown() {
  const data = this.data() as DataBag;
  addExtension(data, "micromarkExtensions", {
    disable: { null: [...DISABLED_MARKDOWN_CONSTRUCTS] },
  });
  addExtension(data, "micromarkExtensions", gfmStrikethrough({ singleTilde: false }));
  addExtension(data, "micromarkExtensions", gfmAutolinkLiteral());
  addExtension(data, "fromMarkdownExtensions", gfmStrikethroughFromMarkdown());
  addExtension(data, "fromMarkdownExtensions", gfmAutolinkLiteralFromMarkdown());

  return (tree) => {
    visit(tree, "blockquote", (node) => {
      flattenBlockquote(node);
    });
    rewriteText(tree, splitSpoilers, SKIP_INLINE_PARENTS);
    rewriteText(tree, splitMentions, SKIP_INLINE_PARENTS);
  };
};

export const messageRehypeHandlers = {
  spoiler(state: { all: (node: object) => unknown[] }, node: object) {
    return {
      type: "element" as const,
      tagName: "span",
      properties: { dataSpoiler: "" },
      children: state.all(node),
    };
  },
  mention(state: { all: (node: object) => unknown[] }, node: { handle?: string }) {
    return {
      type: "element" as const,
      tagName: "span",
      properties: { dataMention: node.handle || "" },
      children: state.all(node),
    };
  },
};

export { splitMentions, splitSpoilers };
