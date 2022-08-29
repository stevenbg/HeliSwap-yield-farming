// @ts-nocheck
import hardhat from 'hardhat';

async function sendReward(campaign: string, reward: string, amount: string) {
  const multiRewards = await hardhat.hethers.getContractAt('MultiRewards', campaign);

  console.log('⚙️ Sending reward and notifying...');
  await multiRewards.notifyRewardAmount(reward, amount);
  console.log('✅ Reward sent');
}

module.exports = sendReward;
