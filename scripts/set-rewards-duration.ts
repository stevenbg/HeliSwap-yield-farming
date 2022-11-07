// @ts-nocheck
import hardhat from 'hardhat';

async function setDuration(campaign: string, token: string, duration: number) {
  const multiRewards = await hardhat.hethers.getContractAt('MultiRewards', campaign);

  console.log('⚙️ Adjusting campaign duration...');
  const tx = await multiRewards.setRewardsDuration(token, duration, {gasLimit: 150_000});
  await tx.wait();
  console.log('✅ Campaign duration adjusted...');
}

module.exports = setDuration;
