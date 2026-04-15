/**
 * ZKGov Documentation Navigation
 * Static structure used by the /docs sidebar and homepage cards.
 */

export interface DocPage {
  slug: string;
  title: string;
  description: string;
}

export interface DocSection {
  title: string;
  pages: DocPage[];
}

export const DOCS_NAVIGATION: DocSection[] = [
  {
    title: "Getting Started",
    pages: [
      {
        slug: "introduction",
        title: "Introduction",
        description: "What ZKGov is, why it exists, and how it works.",
      },
      {
        slug: "quickstart",
        title: "Quickstart",
        description: "Connect your wallet, register, and cast your first anonymous vote.",
      },
      {
        slug: "architecture",
        title: "Architecture",
        description: "On-chain contracts, Semaphore, and how everything fits together.",
      },
    ],
  },
  {
    title: "Voting Guides",
    pages: [
      {
        slug: "zk-identity",
        title: "ZK Identity",
        description: "How Semaphore identities are derived and why they are anonymous.",
      },
      {
        slug: "voting-flow",
        title: "Voting Flow",
        description: "The end-to-end flow from connecting your wallet to casting a vote.",
      },
      {
        slug: "create-proposal",
        title: "Creating Proposals",
        description: "How to create proposals, set quorum, and configure voting periods.",
      },
    ],
  },
  {
    title: "Integrations",
    pages: [
      {
        slug: "telegram",
        title: "Telegram Bot",
        description: "Browse proposals and check stats from any Telegram chat using the ZKGov bot.",
      },
      {
        slug: "openclaw",
        title: "OpenClaw",
        description: "Vote anonymously from Telegram, WhatsApp, Slack, and 20+ other chat apps via OpenClaw.",
      },
    ],
  },
  {
    title: "Developer Tools",
    pages: [
      {
        slug: "cli",
        title: "CLI",
        description: "Use the zkgov command line to query state and vote from your terminal.",
      },
      {
        slug: "mcp",
        title: "MCP Server",
        description: "Let AI agents participate in governance via the Model Context Protocol.",
      },
      {
        slug: "skills",
        title: "Agent Skills",
        description: "Install the ZKGov skill so any AI agent knows when and how to use governance tools.",
      },
      {
        slug: "contracts",
        title: "Smart Contracts",
        description: "ZKVoting contract API, events, and on-chain verification.",
      },
    ],
  },
];

// Flatten to a single list for quick lookup / prev-next nav
export const FLAT_PAGES: (DocPage & { sectionTitle: string })[] = DOCS_NAVIGATION.flatMap((section) =>
  section.pages.map((page) => ({ ...page, sectionTitle: section.title }))
);

export function getDocPage(slug: string): DocPage | undefined {
  return FLAT_PAGES.find((p) => p.slug === slug);
}

export function getAdjacentPages(slug: string): { previous?: DocPage; next?: DocPage } {
  const index = FLAT_PAGES.findIndex((p) => p.slug === slug);
  if (index === -1) return {};
  return {
    previous: index > 0 ? FLAT_PAGES[index - 1] : undefined,
    next: index < FLAT_PAGES.length - 1 ? FLAT_PAGES[index + 1] : undefined,
  };
}
