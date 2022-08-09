// @ts-nocheck
import hardhat from 'hardhat';

async function deploy(owner: string, tokenAddress: string) {
  const MultiRewards = await hardhat.hethers.getContractFactory('MultiRewards');
  const multiRewards = await MultiRewards.deploy(owner, tokenAddress);

  await multiRewards.deployed();

  console.log('MultiRewards contract deployed to:', multiRewards.address);
}

module.exports = deploy;
