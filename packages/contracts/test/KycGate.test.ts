import { expect } from "chai"
import hre, { ethers } from "hardhat"
import { Identity } from "@semaphore-protocol/core"

describe("KycGate", () => {
  let kycGate: any, semaphore: any, mockKycSBT: any, agentRegistry: any
  let kycUser: any, nonKycUser: any, agentAddr: any

  beforeEach(async () => {
    [kycUser, nonKycUser, agentAddr] = await ethers.getSigners()

    // Deploy Semaphore
    const { semaphore: sem } = await hre.run("deploy:semaphore", { logs: false })
    semaphore = sem

    const MockKycSBT = await ethers.getContractFactory("MockKycSBT")
    mockKycSBT = await MockKycSBT.deploy()
    await mockKycSBT.setHuman(kycUser.address, true, 1)

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry")
    agentRegistry = await AgentRegistry.deploy(mockKycSBT.target)

    const KycGate = await ethers.getContractFactory("KycGate")
    kycGate = await KycGate.deploy(semaphore.target, mockKycSBT.target, agentRegistry.target)
  })

  it("creates human and agent groups on deploy", async () => {
    const humanGroupId = await kycGate.humanGroupId()
    const agentGroupId = await kycGate.agentGroupId()
    expect(humanGroupId).to.not.equal(agentGroupId)
  })

  it("allows KYC'd user to register as human voter", async () => {
    const identity = new Identity()
    await kycGate.connect(kycUser).registerHuman(identity.commitment)
    expect(await kycGate.humanRegistered(kycUser.address)).to.be.true
  })

  it("rejects non-KYC'd user from registering", async () => {
    const identity = new Identity()
    await expect(
      kycGate.connect(nonKycUser).registerHuman(identity.commitment)
    ).to.be.revertedWith("Not KYC verified")
  })

  it("prevents double registration", async () => {
    const identity = new Identity()
    await kycGate.connect(kycUser).registerHuman(identity.commitment)
    await expect(
      kycGate.connect(kycUser).registerHuman(identity.commitment)
    ).to.be.revertedWith("Already registered")
  })

  it("prevents same commitment in both groups", async () => {
    const identity = new Identity()

    await kycGate.connect(kycUser).registerHuman(identity.commitment)

    await agentRegistry.connect(kycUser).registerAgent(agentAddr.address)

    await expect(
      kycGate.connect(kycUser).registerAgent(agentAddr.address, identity.commitment)
    ).to.be.revertedWith("Commitment already used")
  })

  it("allows agent registration with different commitment", async () => {
    const humanIdentity = new Identity()
    const agentIdentity = new Identity()

    await kycGate.connect(kycUser).registerHuman(humanIdentity.commitment)
    await agentRegistry.connect(kycUser).registerAgent(agentAddr.address)
    await kycGate.connect(kycUser).registerAgent(agentAddr.address, agentIdentity.commitment)

    expect(await kycGate.agentRegistered(agentAddr.address)).to.be.true
  })
})
