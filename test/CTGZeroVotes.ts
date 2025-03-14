import { ethers, upgrades } from 'hardhat'
import { expect } from 'chai'

describe('CTGZeroVotes contract tests', () => {
  let CTGZeroVotes, cTGZeroVotes, owner

  before(async function () {
    ;[owner] = await ethers.getSigners()
    CTGZeroVotes = await ethers.getContractFactory('CTGZeroVotes')
    cTGZeroVotes = await upgrades.deployProxy(CTGZeroVotes, [owner.address])
  })

  describe('Initialization', function () {
    it('should have correct initial values', async function () {
      expect(await cTGZeroVotes.owner()).to.equal(owner.address)
    })
  })
})
