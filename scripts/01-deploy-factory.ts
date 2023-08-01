// @ts-nocheck
import hardhat from 'hardhat';

const WHBAR_ADDRESS = '0x000000000000000000000000000000000006A6cB';

async function deployFactory() {
  const Factory = await hardhat.hethers.getContractFactory('Factory');

  console.log('⚙️ Deploying factory contract...');
  const factory = await Factory.deploy(WHBAR_ADDRESS);
  await factory.deployed();

  console.log('✅ MultiRewards Factory contract deployed to:', factory.address);
}

module.exports = deployFactory;
