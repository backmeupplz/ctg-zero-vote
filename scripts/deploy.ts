import { ethers, upgrades, run } from 'hardhat'
import { printChainInfo, printSignerInfo, waitOneMinute } from './helpers'

async function main() {
  // Print info
  await printChainInfo()
  await printSignerInfo()
  // Deploy contract
  const contractName = 'CTGZeroVotes'
  console.log(`Deploying ${contractName}...`)
  const Contract = await ethers.getContractFactory(contractName)
  const [deployer] = await ethers.getSigners()
  const contract = await upgrades.deployProxy(
    Contract,
    [
      deployer.address,
    ],
    {
      kind: 'transparent',
    }
  )
  const deploymentTransaction = contract.deploymentTransaction()
  if (!deploymentTransaction) {
    throw new Error('Deployment transaction is null')
  }
  console.log(
    'Deploy tx gas price:',
    ethers.formatEther(deploymentTransaction.gasPrice || 0)
  )
  console.log(
    'Deploy tx gas limit:',
    ethers.formatEther(deploymentTransaction.gasLimit)
  )
  await contract.waitForDeployment()
  // Verify contract
  await waitOneMinute()
  const address = await contract.getAddress()
  console.log('Verifying contract on Etherscan')
  try {
    await run('verify:verify', {
      address,
      constructorArguments: [],
    })
  } catch (err) {
    console.log(
      'Error verifying contract on Etherscan:',
      err instanceof Error ? err.message : err
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
