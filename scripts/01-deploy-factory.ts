// @ts-nocheck
import hardhat from 'hardhat';

// Canonical WHBAR Address on Testnet
// Reference https://github.com/LimeChain/whbar
const WHBAR_ADDRESS = '0x000000000000000000000000000000000006A6cB'; // Testnet WHBAR
const POOL_FACTORY = '0x000000000000000000000000000000000006a74f'; // Testnet DEX factory

async function deployFactory() {
  const Factory = await hardhat.hethers.getContractFactory('Factory');
  const fee = 0;

  console.log('⚙️ Deploying factory contract...');
  const factory = await Factory.deploy(WHBAR_ADDRESS, fee, POOL_FACTORY);
  await factory.deployed();

  console.log('✅ MultiRewards Factory contract deployed to:', factory.address);
}

module.exports = deployFactory;
