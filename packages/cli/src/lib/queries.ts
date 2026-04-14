/**
 * Shared contract read functions.
 * Called by both MCP tool handlers and CLI commands so behavior
 * stays in sync across interfaces.
 */
import { parseAbiItem, decodeEventLog } from "viem";
import { publicClient, ZK_VOTING, EXPLORER_URL, DEPLOYMENT_BLOCK } from "./chain.js";
import { ZK_VOTING_ABI } from "./abi.js";

// ─── Types ──────────────────────────────────────────────────────

export interface Stats {
  totalProposals: number;
  totalMembers: number;
  activeGroupId: number;
  contract: string;
  explorer: string;
  chain: string;
}

export interface Proposal {
  id: number;
  title: string;
  description: string;
  creator: string;
  votingStart: string;
  votingEnd: string;
  quorum: number;
  votes: { for: number; against: number; abstain: number; total: number };
  status: "active" | "passed" | "defeated" | "ended";
  finalized: boolean;
  passed: boolean;
  isActive: boolean;
  explorer: string;
}

export interface ProposalSummary {
  id: number;
  title: string;
  creator: string;
  votingEnd: string;
  votes: { for: number; against: number; abstain: number; total: number };
  quorum: number;
  status: "active" | "passed" | "defeated" | "ended";
}

export interface VoterInfo {
  address: string;
  registered: boolean;
  commitment: string | null;
  explorer: string;
}

export interface MembersInfo {
  memberCount: number;
  merkleRoot: string;
  merkleDepth: number;
}

export interface ActivityEvent {
  type: "proposal_created" | "vote_cast" | "member_registered";
  txHash: string;
  explorerUrl: string;
  [key: string]: unknown;
}

// ─── Queries ────────────────────────────────────────────────────

export async function getStats(): Promise<Stats> {
  const [totalProposals, totalMembers, activeGroupId] = (await publicClient.readContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "getStats",
  })) as [bigint, bigint, bigint];

  return {
    totalProposals: Number(totalProposals),
    totalMembers: Number(totalMembers),
    activeGroupId: Number(activeGroupId),
    contract: ZK_VOTING,
    explorer: `${EXPLORER_URL}/address/${ZK_VOTING}`,
    chain: "HashKey Chain Testnet (ID: 133)",
  };
}

function deriveStatus(finalized: boolean, passed: boolean, isActive: boolean): Proposal["status"] {
  if (finalized) return passed ? "passed" : "defeated";
  return isActive ? "active" : "ended";
}

export async function getProposal(proposalId: number): Promise<Proposal> {
  const content = (await publicClient.readContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "getProposalContent",
    args: [BigInt(proposalId)],
  })) as [string, string, string];

  const state = (await publicClient.readContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "getProposalState",
    args: [BigInt(proposalId)],
  })) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean];

  const [title, description, creator] = content;
  const [votingStart, votingEnd, quorum, votesFor, votesAgainst, votesAbstain, totalVotes, finalized, passed, isActive] = state;

  return {
    id: proposalId,
    title,
    description,
    creator,
    votingStart: new Date(Number(votingStart) * 1000).toISOString(),
    votingEnd: new Date(Number(votingEnd) * 1000).toISOString(),
    quorum: Number(quorum),
    votes: {
      for: Number(votesFor),
      against: Number(votesAgainst),
      abstain: Number(votesAbstain),
      total: Number(totalVotes),
    },
    status: deriveStatus(finalized, passed, isActive),
    finalized,
    passed,
    isActive,
    explorer: `${EXPLORER_URL}/address/${ZK_VOTING}`,
  };
}

export async function listProposals(): Promise<ProposalSummary[]> {
  const count = (await publicClient.readContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "proposalCount",
  })) as bigint;

  const proposals: ProposalSummary[] = [];
  for (let i = 1; i <= Number(count); i++) {
    const content = (await publicClient.readContract({
      address: ZK_VOTING,
      abi: ZK_VOTING_ABI,
      functionName: "getProposalContent",
      args: [BigInt(i)],
    })) as [string, string, string];

    const state = (await publicClient.readContract({
      address: ZK_VOTING,
      abi: ZK_VOTING_ABI,
      functionName: "getProposalState",
      args: [BigInt(i)],
    })) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean];

    const [title, , creator] = content;
    const [, votingEnd, quorum, votesFor, votesAgainst, votesAbstain, totalVotes, finalized, passed, isActive] = state;

    proposals.push({
      id: i,
      title,
      creator,
      votingEnd: new Date(Number(votingEnd) * 1000).toISOString(),
      votes: { for: Number(votesFor), against: Number(votesAgainst), abstain: Number(votesAbstain), total: Number(totalVotes) },
      quorum: Number(quorum),
      status: deriveStatus(finalized, passed, isActive),
    });
  }

  return proposals;
}

export async function checkVoter(address: string): Promise<VoterInfo> {
  const result = (await publicClient.readContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "isVoter",
    args: [address as `0x${string}`],
  })) as [boolean, bigint];

  return {
    address,
    registered: result[0],
    commitment: result[0] ? result[1].toString() : null,
    explorer: `${EXPLORER_URL}/address/${address}`,
  };
}

export async function getMembers(): Promise<MembersInfo> {
  const [count, root, depth] = await Promise.all([
    publicClient.readContract({ address: ZK_VOTING, abi: ZK_VOTING_ABI, functionName: "memberCount" }) as Promise<bigint>,
    publicClient.readContract({ address: ZK_VOTING, abi: ZK_VOTING_ABI, functionName: "getMerkleRoot" }) as Promise<bigint>,
    publicClient.readContract({ address: ZK_VOTING, abi: ZK_VOTING_ABI, functionName: "getMerkleDepth" }) as Promise<bigint>,
  ]);

  return {
    memberCount: Number(count),
    merkleRoot: root.toString(),
    merkleDepth: Number(depth),
  };
}

const proposalCreatedEvent = parseAbiItem("event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title, uint256 votingEnd)");
const voteCastEvent = parseAbiItem("event VoteCast(uint256 indexed proposalId, uint256 nullifier, uint8 choice)");
const memberRegisteredEvent = parseAbiItem("event MemberRegistered(address indexed member, uint256 commitment)");

export async function getActivity(limit: number = 20): Promise<ActivityEvent[]> {
  const logs = await publicClient.getLogs({
    address: ZK_VOTING,
    fromBlock: BigInt(DEPLOYMENT_BLOCK),
    toBlock: "latest",
  });

  const choices = ["Against", "For", "Abstain"];
  const activity: ActivityEvent[] = [];

  for (const log of logs.slice(-limit * 2)) {
    const txHash = log.transactionHash!;
    const explorerUrl = `${EXPLORER_URL}/tx/${txHash}`;

    try {
      const decoded = decodeEventLog({ abi: [proposalCreatedEvent], data: log.data, topics: log.topics });
      activity.push({
        type: "proposal_created",
        proposalId: Number((decoded.args as any).proposalId),
        title: (decoded.args as any).title,
        creator: (decoded.args as any).creator,
        txHash,
        explorerUrl,
      });
      continue;
    } catch {}

    try {
      const decoded = decodeEventLog({ abi: [voteCastEvent], data: log.data, topics: log.topics });
      activity.push({
        type: "vote_cast",
        proposalId: Number((decoded.args as any).proposalId),
        choice: choices[(decoded.args as any).choice] || "Unknown",
        txHash,
        explorerUrl,
      });
      continue;
    } catch {}

    try {
      const decoded = decodeEventLog({ abi: [memberRegisteredEvent], data: log.data, topics: log.topics });
      activity.push({
        type: "member_registered",
        member: (decoded.args as any).member,
        txHash,
        explorerUrl,
      });
    } catch {}
  }

  return activity.slice(-limit).reverse();
}
