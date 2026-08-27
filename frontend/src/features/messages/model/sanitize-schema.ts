import { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";

const ALLOWED_TAGS = [
  "a",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "ul",
] as const;

export function schemaAttributeList(
  attributes: SanitizeSchema["attributes"],
  tag: string,
): string[] {
  const value = attributes?.[tag];
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export const messageSanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  tagNames: [...ALLOWED_TAGS],
  attributes: {
    ...defaultSchema.attributes,
    a: [...schemaAttributeList(defaultSchema.attributes, "a"), "target", "rel"],
    code: [...schemaAttributeList(defaultSchema.attributes, "code"), "className"],
    pre: [...schemaAttributeList(defaultSchema.attributes, "pre"), "className"],
    span: ["dataSpoiler", "dataMention", "className"],
  },
};
