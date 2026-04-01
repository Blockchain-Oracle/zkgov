import { expect } from "chai"
import { ethers } from "hardhat"

describe("AgentRegistry", () => {
  let agentRegistry: any
  let mockKycSBT: any
  let owner: any, agent1: any, nonKycUser: any

  beforeEach(async () => {
    [owner, agent1, nonKycUser] = await ethers.getSigners()

    const MockKycSBT = await ethers.getContractFactory("MockKycSBT")
    mockKycSBT = await MockKycSBT.deploy()
    await mockKycSBT.setHuman(owner.address, true, 1)

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry")
    agentRegistry = await AgentRegistry.deploy(mockKycSBT.target)
  })

  it("allows KYC'd user to register an agent", async () => {
    await agentRegistry.registerAgent(agent1.address)
    expect(await agentRegistry.isVerifiedAgent(agent1.address)).to.be.true
    expect(await agentRegistry.getAgentOwner(agent1.address)).to.equal(owner.address)
  })

  it("rejects non-KYC'd user from registering an agent", async () => {
    await expect(
      agentRegistry.connect(nonKycUser).registerAgent(agent1.address)
    ).to.be.revertedWith("Owner not KYC verified")
  })

  it("prevents double registration", async () => {
    await agentRegistry.registerAgent(agent1.address)
    await expect(
      agentRegistry.registerAgent(agent1.address)
    ).to.be.revertedWith("Already registered")
  })

  it("allows owner to deregister agent", async () => {
    await agentRegistry.registerAgent(agent1.address)
    await agentRegistry.deregisterAgent(agent1.address)
    expect(await agentRegistry.isVerifiedAgent(agent1.address)).to.be.false
  })

  it("rejects deregister from non-owner", async () => {
    await agentRegistry.registerAgent(agent1.address)
    await expect(
      agentRegistry.connect(nonKycUser).deregisterAgent(agent1.address)
    ).to.be.revertedWith("Not agent owner")
  })

  it("returns list of owner agents", async () => {
    await agentRegistry.registerAgent(agent1.address)
    const agents = await agentRegistry.getOwnerAgents(owner.address)
    expect(agents).to.have.lengthOf(1)
    expect(agents[0]).to.equal(agent1.address)
  })
})
