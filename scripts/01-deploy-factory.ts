// @ts-nocheck
import hardhat from 'hardhat';

// Canonical WHBAR Address on Testnet
// Reference https://github.com/LimeChain/whbar
const WHBAR_ADDRESS = '0x0000000000000000000000000000000002be8c90';

async function deployFactory() {
  const Factory = await hardhat.hethers.getContractFactory('Factory');

  console.log('⚙️ Deploying factory contract...');
  const factory = await Factory.deploy(WHBAR_ADDRESS);
  await factory.deployed();

  console.log('✅ MultiRewards Factory contract deployed to:', factory.address);
}

module.exports = deployFactory;
