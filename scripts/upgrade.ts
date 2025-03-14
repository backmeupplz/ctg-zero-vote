import { ethers, network, run, upgrades } from 'hardhat'

async function main() {
  const factory = await ethers.getContractFactory('CTGZeroVotes')
  const proxyAddress =
    network.name === 'testnet'
      ? '0x3F74715414998C97875B5Cc37f086e97706BeD38'
      : '0x3F74715414998C97875B5Cc37f086e97706BeD38'
  console.log('Upgrading CTGZeroVotes...')
  const contract = await upgrades.upgradeProxy(proxyAddress as string, factory)
  console.log('CTGZeroVotes upgraded')
  console.log(
    await upgrades.erc1967.getImplementationAddress(
      await contract.getAddress()
    ),
    ' getImplementationAddress'
  )
  console.log(
    await upgrades.erc1967.getAdminAddress(await contract.getAddress()),
    ' getAdminAddress'
  )
  console.log('Wait for 1 minute to make sure blockchain is updated')
  await new Promise((resolve) => setTimeout(resolve, 60 * 1000))
  // Try to verify the contract on Etherscan
  console.log('Verifying contract on Etherscan')
  try {
    await run('verify:verify', {
      address: await upgrades.erc1967.getImplementationAddress(
        await contract.getAddress()
      ),
      constructorArguments: [],
    })
  } catch (err) {
    console.log(
      'Error verifying contract on Etherscan:',
      err instanceof Error ? err.message : err
    )
  }
  // Print out the information
  console.log(`Done!`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
