import hre, { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying with:", deployer.address)
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "HSK")

  // 1. Deploy Semaphore (Verifier + PoseidonT3 + Semaphore)
  console.log("\n1. Deploying Semaphore...")
  const { semaphore } = await hre.run("deploy:semaphore", { logs: true })
  console.log("   Semaphore:", semaphore.target)

  // 2. Deploy MockKycSBT (our own instance for testnet)
  console.log("\n2. Deploying MockKycSBT...")
  const MockKycSBT = await ethers.getContractFactory("MockKycSBT")
  const kycSBT = await MockKycSBT.deploy()
  await kycSBT.waitForDeployment()
  console.log("   KycSBT:", kycSBT.target)

  // 3. Deploy AgentRegistry
  console.log("\n3. Deploying AgentRegistry...")
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry")
  const agentRegistry = await AgentRegistry.deploy(kycSBT.target)
  await agentRegistry.waitForDeployment()
  console.log("   AgentRegistry:", agentRegistry.target)

  // 4. Deploy KycGate (creates human + agent Semaphore groups)
  console.log("\n4. Deploying KycGate...")
  const KycGate = await ethers.getContractFactory("KycGate")
  const kycGate = await KycGate.deploy(semaphore.target, kycSBT.target, agentRegistry.target)
  await kycGate.waitForDeployment()
  console.log("   KycGate:", kycGate.target)

  const humanGroupId = await kycGate.humanGroupId()
  const agentGroupId = await kycGate.agentGroupId()
  console.log("   Human Group ID:", humanGroupId.toString())
  console.log("   Agent Group ID:", agentGroupId.toString())

  // 5. Deploy ZKGovernance
  console.log("\n5. Deploying ZKGovernance...")
  const ZKGovernance = await ethers.getContractFactory("ZKGovernance")
  const zkGovernance = await ZKGovernance.deploy(semaphore.target, kycGate.target)
  await zkGovernance.waitForDeployment()
  console.log("   ZKGovernance:", zkGovernance.target)

  // 6. Pre-approve deployer for KYC (so we can test)
  console.log("\n6. Pre-approving deployer for KYC...")
  await kycSBT.setHuman(deployer.address, true, 1)
  console.log("   Deployer KYC approved")

  // Summary
  console.log("\n" + "=".repeat(50))
  console.log("DEPLOYMENT COMPLETE")
  console.log("=".repeat(50))
  console.log(`SEMAPHORE_ADDRESS=${semaphore.target}`)
  console.log(`KYC_SBT_ADDRESS=${kycSBT.target}`)
  console.log(`AGENT_REGISTRY_ADDRESS=${agentRegistry.target}`)
  console.log(`KYC_GATE_ADDRESS=${kycGate.target}`)
  console.log(`ZK_GOVERNANCE_ADDRESS=${zkGovernance.target}`)
  console.log(`HUMAN_GROUP_ID=${humanGroupId.toString()}`)
  console.log(`AGENT_GROUP_ID=${agentGroupId.toString()}`)
  console.log("=".repeat(50))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
