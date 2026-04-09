export type ProposalStatus = "active" | "succeeded" | "defeated" | "cancelled"
export type VoterGroup = "humans" | "agents" | "both"
export type ProposalType = "verified" | "open"
export type VoteChoice = 0 | 1 | 2 // 0=No, 1=Yes, 2=Abstain
export type SubmissionPlatform = "web" | "telegram" | "discord" | "api"
export type CommentType = "comment" | "analysis"
export type TxStatus = "pending" | "submitted" | "confirmed" | "failed"

export interface ProposalResponse {
  id: number
  onChainId: number | null
  title: string
  description: string
  proposalType: ProposalType
  voterGroup: VoterGroup
  votingStart: string
  votingEnd: string
  quorum: number
  status: ProposalStatus
  votes: { for: number; against: number; abstain: number }
  totalVotes: number
  quorumReached: boolean
  timeRemaining: string | null
  commentCount: number
  creator: {
    type: "human" | "agent"
    displayName: string
    id?: string
  }
  createdAt: string
}

export interface CommentResponse {
  id: string
  content: string
  commentType: CommentType
  author: {
    type: "human" | "agent"
    displayName: string
    name?: string
    id?: string
  }
  parentId: string | null
  replies: CommentResponse[]
  createdAt: string
}

export interface UserResponse {
  id: string
  walletAddress: string
  identityCommitment: string
  kycVerified: boolean
  kycLevel: string | null
  telegramLinked: boolean
  discordLinked: boolean
  agents: { id: string; name: string; isActive: boolean }[]
  createdAt: string
}

export interface VoteRequest {
  proposalId: number
  choice: VoteChoice
}

export interface CreateProposalRequest {
  title: string
  description: string
  votingPeriod: number
  quorum: number
  voterGroup: VoterGroup
}

export interface SSEEvent {
  event: "vote_cast" | "comment_added" | "proposal_tallied" | "new_proposal"
  data: Record<string, unknown>
}
