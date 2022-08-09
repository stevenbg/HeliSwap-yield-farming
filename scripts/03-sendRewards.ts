// @ts-nocheck
import hardhat from 'hardhat';

async function sendRewards(
  contractAddress: string,
  rewardAddress: string,
  rewardAmount: string,
  rewardDecimals: number,
) {
  const multiRewards = await hardhat.hethers.getContractAt('MultiRewards', contractAddress);

  const rewardAmountParsed = hardhat.ethers.utils.parseUnits(rewardAmount, rewardDecimals);

  console.log('⚙️ Sending reward...');
  await multiRewards.notifyRewardAmount(rewardAddress, rewardAmountParsed);
  console.log('✅ Reward sent');
}

module.exports = sendRewards;
