// ─── Vote Types ──────────────────────────────────────────

export type VoteChoice = 0 | 1 | 2 // 0=Against, 1=For, 2=Abstain
export type CommentType = "comment" | "analysis"

// ─── Proposal (from contract view functions) ─────────────

export interface ProposalContent {
  title: string
  description: string
  creator: string // address
}

export interface ProposalState {
  votingStart: bigint
  votingEnd: bigint
  quorum: bigint
  votesFor: bigint
  votesAgainst: bigint
  votesAbstain: bigint
  totalVotes: bigint
  finalized: boolean
  passed: boolean
  isActive: boolean
}

export interface Proposal {
  id: number
  title: string
  description: string
  creator: string
  votingStart: number
  votingEnd: number
  quorum: number
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  totalVotes: number
  finalized: boolean
  passed: boolean
  isActive: boolean
}

// ─── User ────────────────────────────────────────────────

export interface UserResponse {
  id: string
  walletAddress: string
  telegramLinked: boolean
  discordLinked: boolean
  createdAt: string
}

// ─── Comments ────────────────────────────────────────────

export interface CommentResponse {
  id: string
  content: string
  commentType: CommentType
  author: {
    type: "human"
    displayName: string
    id?: string
  }
  parentId: string | null
  replies: CommentResponse[]
  createdAt: string
}

// ─── SSE Events ──────────────────────────────────────────

export interface SSEEvent {
  event: "vote_cast" | "comment_added" | "proposal_created" | "proposal_finalized"
  data: Record<string, unknown>
}
