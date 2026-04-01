import { expect } from "chai"
import hre, { ethers } from "hardhat"
import { Identity, Group, generateProof } from "@semaphore-protocol/core"

describe("ZKGovernance", () => {
  let zkGovernance: any, semaphore: any, kycGate: any, mockKycSBT: any, agentRegistry: any
  let deployer: any, voter1: any, voter2: any

  beforeEach(async () => {
    [deployer, voter1, voter2] = await ethers.getSigners()

    const { semaphore: sem } = await hre.run("deploy:semaphore", { logs: false })
    semaphore = sem

    const MockKycSBT = await ethers.getContractFactory("MockKycSBT")
    mockKycSBT = await MockKycSBT.deploy()
    await mockKycSBT.setHuman(voter1.address, true, 1)
    await mockKycSBT.setHuman(voter2.address, true, 1)

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry")
    agentRegistry = await AgentRegistry.deploy(mockKycSBT.target)

    const KycGate = await ethers.getContractFactory("KycGate")
    kycGate = await KycGate.deploy(semaphore.target, mockKycSBT.target, agentRegistry.target)

    const ZKGovernance = await ethers.getContractFactory("ZKGovernance")
    zkGovernance = await ZKGovernance.deploy(semaphore.target, kycGate.target)
  })

  it("creates a proposal", async () => {
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test proposal"))
    const tx = await zkGovernance.createProposal(
      contentHash, "", 86400, 2, 2 // 24h, quorum 2, VoterGroup.Both
    )
    const receipt = await tx.wait()
    expect(receipt!.status).to.equal(1)

    const proposal = await zkGovernance.getProposal(1)
    expect(proposal.contentHash).to.equal(contentHash)
    expect(proposal.quorum).to.equal(2)
  })

  it("allows anonymous voting with valid ZK proof", async () => {
    const identity = new Identity()
    await kycGate.connect(voter1).registerHuman(identity.commitment)

    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test"))
    await zkGovernance.createProposal(contentHash, "", 86400, 1, 0) // HumansOnly

    const group = new Group([identity.commitment])

    // Generate ZK proof: vote YES (1), scope = proposalId (1)
    const proof = await generateProof(identity, group, 1, 1)

    await zkGovernance.castVote(
      1,
      proof.merkleTreeDepth,
      proof.merkleTreeRoot,
      proof.nullifier,
      proof.message,
      proof.points
    )

    const proposal = await zkGovernance.getProposal(1)
    expect(proposal.votesFor).to.equal(1)
  })

  it("prevents double voting (same nullifier)", async () => {
    const identity = new Identity()
    await kycGate.connect(voter1).registerHuman(identity.commitment)

    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test"))
    await zkGovernance.createProposal(contentHash, "", 86400, 1, 0)

    const group = new Group([identity.commitment])
    const proof = await generateProof(identity, group, 1, 1)

    await zkGovernance.castVote(
      1, proof.merkleTreeDepth, proof.merkleTreeRoot,
      proof.nullifier, proof.message, proof.points
    )

    // Same identity voting again — generates same nullifier for same scope
    const proof2 = await generateProof(identity, group, 0, 1)
    await expect(
      zkGovernance.castVote(
        1, proof2.merkleTreeDepth, proof2.merkleTreeRoot,
        proof2.nullifier, proof2.message, proof2.points
      )
    ).to.be.reverted
  })

  it("tallies proposal correctly", async () => {
    const id1 = new Identity()
    const id2 = new Identity()
    await kycGate.connect(voter1).registerHuman(id1.commitment)
    await kycGate.connect(voter2).registerHuman(id2.commitment)

    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test"))
    // votingPeriod = 60 seconds (enough time to generate proofs)
    await zkGovernance.createProposal(contentHash, "", 60, 2, 0)

    const group = new Group([id1.commitment, id2.commitment])

    // Voter 1 votes YES
    const proof1 = await generateProof(id1, group, 1, 1)
    await zkGovernance.castVote(
      1, proof1.merkleTreeDepth, proof1.merkleTreeRoot,
      proof1.nullifier, proof1.message, proof1.points
    )

    // Voter 2 votes NO
    const proof2 = await generateProof(id2, group, 0, 1)
    await zkGovernance.castVote(
      1, proof2.merkleTreeDepth, proof2.merkleTreeRoot,
      proof2.nullifier, proof2.message, proof2.points
    )

    // Advance time past voting period
    await ethers.provider.send("evm_increaseTime", [61])
    await ethers.provider.send("evm_mine", [])

    await zkGovernance.tallyProposal(1)
    const proposal = await zkGovernance.getProposal(1)
    // 1 for, 1 against = not majority, quorum met (2) => Defeated
    expect(proposal.state).to.equal(2) // Defeated
  })

  it("allows creator to cancel proposal", async () => {
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test"))
    await zkGovernance.createProposal(contentHash, "", 86400, 1, 0)

    await zkGovernance.cancelProposal(1)
    const proposal = await zkGovernance.getProposal(1)
    expect(proposal.state).to.equal(3) // Cancelled
  })
})
