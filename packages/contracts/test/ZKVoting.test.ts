import { expect } from "chai"
import hre, { ethers } from "hardhat"
import { Identity, Group, generateProof } from "@semaphore-protocol/core"

describe("ZKVoting", () => {
  let zkVoting: any, semaphore: any
  let deployer: any, voter1: any, voter2: any

  beforeEach(async () => {
    [deployer, voter1, voter2] = await ethers.getSigners()

    const { semaphore: sem } = await hre.run("deploy:semaphore", { logs: false })
    semaphore = sem

    const ZKVoting = await ethers.getContractFactory("ZKVoting")
    zkVoting = await ZKVoting.deploy(semaphore.target)
  })

  it("allows anyone to register", async () => {
    const identity = new Identity()
    await zkVoting.connect(voter1).register(identity.commitment)

    const [registered, commitment] = await zkVoting.isVoter(voter1.address)
    expect(registered).to.be.true
    expect(commitment).to.equal(identity.commitment)
  })

  it("prevents double registration", async () => {
    const identity = new Identity()
    await zkVoting.connect(voter1).register(identity.commitment)
    await expect(
      zkVoting.connect(voter1).register(identity.commitment)
    ).to.be.revertedWith("Already registered")
  })

  it("creates a proposal", async () => {
    const tx = await zkVoting.createProposal("Test Proposal", "Description here", 86400, 2)
    const receipt = await tx.wait()
    expect(receipt!.status).to.equal(1)

    const [title, desc, creator] = await zkVoting.getProposalContent(1)
    expect(title).to.equal("Test Proposal")
    expect(creator).to.equal(deployer.address)
  })

  it("allows anonymous voting with ZK proof", async () => {
    // Register voter
    const identity = new Identity()
    await zkVoting.connect(voter1).register(identity.commitment)

    // Create proposal
    await zkVoting.createProposal("Vote Test", "Testing ZK votes", 86400, 1)

    // Build group and generate proof
    const group = new Group([identity.commitment])
    const proof = await generateProof(identity, group, 1, 1) // vote FOR, scope = proposalId 1

    // Cast vote
    await zkVoting.castVote(
      1, proof.merkleTreeDepth, proof.merkleTreeRoot,
      proof.nullifier, proof.message, proof.points
    )

    const [,,,votesFor,,,totalVotes,,,,] = await zkVoting.getProposalState(1)
    expect(votesFor).to.equal(1)
    expect(totalVotes).to.equal(1)
  })

  it("prevents double voting", async () => {
    const identity = new Identity()
    await zkVoting.connect(voter1).register(identity.commitment)
    await zkVoting.createProposal("Double Vote Test", "Test", 86400, 1)

    const group = new Group([identity.commitment])
    const proof1 = await generateProof(identity, group, 1, 1)
    await zkVoting.castVote(1, proof1.merkleTreeDepth, proof1.merkleTreeRoot, proof1.nullifier, proof1.message, proof1.points)

    // Same identity, same proposal → same nullifier → should fail
    const proof2 = await generateProof(identity, group, 0, 1)
    await expect(
      zkVoting.castVote(1, proof2.merkleTreeDepth, proof2.merkleTreeRoot, proof2.nullifier, proof2.message, proof2.points)
    ).to.be.reverted
  })

  it("returns correct stats", async () => {
    const id1 = new Identity()
    const id2 = new Identity()
    await zkVoting.connect(voter1).register(id1.commitment)
    await zkVoting.connect(voter2).register(id2.commitment)
    await zkVoting.createProposal("Stats Test", "Test", 86400, 1)

    const [totalProposals, totalMembers] = await zkVoting.getStats()
    expect(totalProposals).to.equal(1)
    expect(totalMembers).to.equal(2)
  })

  it("finalizes proposal correctly", async () => {
    const id1 = new Identity()
    const id2 = new Identity()
    await zkVoting.connect(voter1).register(id1.commitment)
    await zkVoting.connect(voter2).register(id2.commitment)

    await zkVoting.createProposal("Finalize Test", "Test", 3601, 2) // just over 1 hour

    const group = new Group([id1.commitment, id2.commitment])

    // Both vote FOR
    const proof1 = await generateProof(id1, group, 1, 1)
    await zkVoting.castVote(1, proof1.merkleTreeDepth, proof1.merkleTreeRoot, proof1.nullifier, proof1.message, proof1.points)

    const proof2 = await generateProof(id2, group, 1, 1)
    await zkVoting.castVote(1, proof2.merkleTreeDepth, proof2.merkleTreeRoot, proof2.nullifier, proof2.message, proof2.points)

    // Advance time
    await ethers.provider.send("evm_increaseTime", [3602])
    await ethers.provider.send("evm_mine", [])

    await zkVoting.finalizeProposal(1)

    const [,,,,,,,, passed,] = await zkVoting.getProposalState(1)
    expect(passed).to.be.true
  })
})
