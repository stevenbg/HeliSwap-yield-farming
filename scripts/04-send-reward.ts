// @ts-nocheck
import hardhat from 'hardhat';

async function sendReward(campaign: string, reward: string, amount: string) {
  const multiRewards = await hardhat.hethers.getContractAt('MultiRewards', campaign);

  console.log('⚙️ Sending reward and notifying...');
  const tx = await multiRewards.notifyRewardAmount(reward, amount, { gasLimit: 200_000});
  await tx.wait();
  console.log('✅ Reward sent');
}

module.exports = sendReward;
