// @ts-nocheck
import hardhat from 'hardhat';

async function addRewards(
  contractAddress: string,
  rewardsAddress: string,
  rewardsDistributor: string,
  rewardsDuration: number,
) {
  const multiRewards = await hardhat.hethers.getContractAt('MultiRewards', contractAddress);

  console.log('⚙️ Adding reward...');
  await multiRewards.addReward(rewardsAddress, rewardsDistributor, rewardsDuration);
  console.log('✅ Reward added');
}

module.exports = addRewards;
