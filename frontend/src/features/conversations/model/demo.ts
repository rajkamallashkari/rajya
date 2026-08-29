import type { LastActivity } from "@/features/conversations/model/preview";

export interface DemoConversation {
  id: string;
  lastActivity: LastActivity;
  messages: DemoMessage[];
  name: string;
  timestampLabel: string;
  unreadCount: number;
}

export interface DemoMessage {
  body: string;
  id: string;
  side: "sent" | "received";
}

export const ADA_DEMO: DemoConversation = {
  id: "ada",
  lastActivity: { kind: "text", text: "See you at the gate" },
  messages: [
    { body: "Are you free later?", id: "ada-1", side: "received" },
    { body: "See you at the gate", id: "ada-2", side: "sent" },
  ],
  name: "Ada Lovelace",
  timestampLabel: "14:02",
  unreadCount: 2,
};

const EXTRA_DEMO_NAMES = [
  "Grace Hopper",
  "Alan Turing",
  "Katherine Johnson",
  "Hedy Lamarr",
  "Claude Shannon",
  "Margaret Hamilton",
  "John von Neumann",
  "Radia Perlman",
  "Tim Berners-Lee",
  "Barbara Liskov",
  "Donald Knuth",
  "Adele Goldberg",
] as const;

export const DEMO_CONVERSATIONS: DemoConversation[] = [
  ADA_DEMO,
  {
    id: "team",
    lastActivity: { kind: "text", senderName: "Ada Lovelace", text: "Ship the gallery" },
    messages: [
      { body: "Ship the gallery", id: "team-1", side: "received" },
      { body: "On it.", id: "team-2", side: "sent" },
    ],
    name: "Team",
    timestampLabel: "13:40",
    unreadCount: 0,
  },
  {
    id: "notes",
    lastActivity: { kind: "system", text: "Group created" },
    messages: [{ body: "Welcome", id: "notes-1", side: "received" }],
    name: "Notes",
    timestampLabel: "12:00",
    unreadCount: 0,
  },
  ...EXTRA_DEMO_NAMES.map((name, index) => ({
    id: `demo-${String(index)}`,
    lastActivity: { kind: "text" as const, text: "Ping" },
    messages: [{ body: "Ping", id: `demo-${String(index)}-1`, side: "received" as const }],
    name,
    timestampLabel: "11:00",
    unreadCount: 0,
  })),
];

export function conversationById(id: string): DemoConversation | undefined {
  return DEMO_CONVERSATIONS.find((item) => item.id === id);
}
