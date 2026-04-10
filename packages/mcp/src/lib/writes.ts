/**
 * Write operations against the ZKVoting contract.
 *
 * Each function signs its own transaction with the wallet from
 * wallet.ts and returns { txHash, explorerUrl }.
 *
 * The vote function additionally generates a Groth16 ZK proof
 * using @semaphore-protocol/core — this takes ~2-5 seconds.
 */
import { parseAbiItem, formatEther } from "viem";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import { publicClient, ZK_VOTING, EXPLORER_URL, DEPLOYMENT_BLOCK } from "./chain.js";
import { ZK_VOTING_ABI } from "./abi.js";
import { loadOrCreateWallet, getWalletClient, getIdentity, getAccount } from "./wallet.js";
import { checkVoter } from "./queries.js";

export interface TxResult {
  txHash: string;
  explorerUrl: string;
  status: "success" | "reverted";
}

// ─── Wallet info ────────────────────────────────────────────────

export interface WalletInfo {
  address: string;
  balance: string;
  balanceWei: string;
  registered: boolean;
  commitment: string | null;
  configPath: string;
  explorer: string;
}

export async function getWalletInfo(): Promise<WalletInfo> {
  const { configPath } = await import("./wallet.js");
  const config = loadOrCreateWallet();
  const balanceWei = await publicClient.getBalance({ address: config.address });
  const voter = await checkVoter(config.address);

  return {
    address: config.address,
    balance: formatEther(balanceWei),
    balanceWei: balanceWei.toString(),
    registered: voter.registered,
    commitment: voter.commitment,
    configPath: configPath(),
    explorer: `${EXPLORER_URL}/address/${config.address}`,
  };
}

// ─── Register as voter ──────────────────────────────────────────

export async function register(): Promise<TxResult> {
  const config = loadOrCreateWallet();
  const voter = await checkVoter(config.address);
  if (voter.registered) {
    throw new Error("This wallet is already registered as a voter");
  }

  const wallet = getWalletClient(config);
  const identity = getIdentity(config);

  const txHash = await wallet.writeContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "register",
    args: [identity.commitment],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    txHash,
    explorerUrl: `${EXPLORER_URL}/tx/${txHash}`,
    status: receipt.status === "success" ? "success" : "reverted",
  };
}

// ─── Create proposal ────────────────────────────────────────────

export interface CreateProposalArgs {
  title: string;
  description: string;
  votingPeriodSeconds: number;
  quorum: number;
}

export async function createProposal(args: CreateProposalArgs): Promise<TxResult & { proposalId?: number }> {
  const wallet = getWalletClient();

  const txHash = await wallet.writeContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "createProposal",
    args: [
      args.title,
      args.description,
      BigInt(args.votingPeriodSeconds),
      BigInt(args.quorum),
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  // Read new proposal count to return the ID
  let proposalId: number | undefined;
  try {
    const count = (await publicClient.readContract({
      address: ZK_VOTING,
      abi: ZK_VOTING_ABI,
      functionName: "proposalCount",
    })) as bigint;
    proposalId = Number(count);
  } catch {}

  return {
    txHash,
    explorerUrl: `${EXPLORER_URL}/tx/${txHash}`,
    status: receipt.status === "success" ? "success" : "reverted",
    proposalId,
  };
}

// ─── Cast vote (ZK-proof) ───────────────────────────────────────

const memberRegisteredEvent = parseAbiItem(
  "event MemberRegistered(address indexed member, uint256 commitment)"
);

export async function castVote(proposalId: number, choice: 0 | 1 | 2): Promise<TxResult> {
  const config = loadOrCreateWallet();
  const voter = await checkVoter(config.address);
  if (!voter.registered) {
    throw new Error("Wallet is not registered. Run `zkgov register` first.");
  }

  const wallet = getWalletClient(config);
  const identity = getIdentity(config);

  // Fetch all registered members from on-chain events to build the group
  const logs = await publicClient.getLogs({
    address: ZK_VOTING,
    event: memberRegisteredEvent,
    fromBlock: BigInt(DEPLOYMENT_BLOCK),
    toBlock: "latest",
  });

  const commitments = logs.map((log) => BigInt((log as any).args.commitment));
  if (commitments.length === 0) {
    throw new Error("No registered members found on-chain");
  }

  const group = new Group(commitments);

  // Generate ZK proof (Groth16 via snarkjs under the hood)
  // message = vote choice, scope = proposalId
  const proof = await generateProof(identity, group, choice, proposalId);

  const txHash = await wallet.writeContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "castVote",
    args: [
      BigInt(proposalId),
      BigInt(proof.merkleTreeDepth),
      BigInt(proof.merkleTreeRoot),
      BigInt(proof.nullifier),
      BigInt(proof.message),
      proof.points.map(BigInt) as unknown as readonly [
        bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint,
      ],
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    txHash,
    explorerUrl: `${EXPLORER_URL}/tx/${txHash}`,
    status: receipt.status === "success" ? "success" : "reverted",
  };
}

// ─── Finalize proposal ──────────────────────────────────────────

export async function finalizeProposal(proposalId: number): Promise<TxResult> {
  const wallet = getWalletClient();

  const txHash = await wallet.writeContract({
    address: ZK_VOTING,
    abi: ZK_VOTING_ABI,
    functionName: "finalizeProposal",
    args: [BigInt(proposalId)],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    txHash,
    explorerUrl: `${EXPLORER_URL}/tx/${txHash}`,
    status: receipt.status === "success" ? "success" : "reverted",
  };
}
