import hre, { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying with:", deployer.address)
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "HSK")

  // 1. Deploy Semaphore (Verifier + PoseidonT3 + Semaphore)
  console.log("\n1. Deploying Semaphore...")
  const { semaphore } = await hre.run("deploy:semaphore", { logs: true })
  console.log("   Semaphore:", semaphore.target)

  // 2. Deploy ZKVoting
  console.log("\n2. Deploying ZKVoting...")
  const ZKVoting = await ethers.getContractFactory("ZKVoting")
  const zkVoting = await ZKVoting.deploy(semaphore.target)
  await zkVoting.waitForDeployment()
  console.log("   ZKVoting:", zkVoting.target)

  // Read group ID created by constructor
  const [totalProposals, totalMembers, groupId] = await zkVoting.getStats()
  console.log("   Group ID:", groupId.toString())

  // Get deployment block
  const block = await ethers.provider.getBlockNumber()

  // Summary
  console.log("\n" + "=".repeat(50))
  console.log("DEPLOYMENT COMPLETE")
  console.log("=".repeat(50))
  console.log(`SEMAPHORE_ADDRESS=${semaphore.target}`)
  console.log(`ZK_VOTING_ADDRESS=${zkVoting.target}`)
  console.log(`GROUP_ID=${groupId.toString()}`)
  console.log(`DEPLOYMENT_BLOCK=${block}`)
  console.log("=".repeat(50))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
