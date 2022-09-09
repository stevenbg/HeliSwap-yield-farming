// @ts-nocheck
import hardhat from 'hardhat';

async function enableRewards(campaign: string, reward: string, duration: string, isHTS = false) {
  const multiRewards = await hardhat.hethers.getContractAt('MultiRewards', campaign);

  console.log('⚙️ Enabling reward...');
  await multiRewards.enableReward(reward, isHTS, duration);
  console.log('✅ Reward enabled');
}

module.exports = enableRewards;
