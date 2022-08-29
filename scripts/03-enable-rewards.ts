// @ts-nocheck
import hardhat from 'hardhat';

async function enableRewards(campaign: string, reward: string, duration: string) {
    const multiRewards = await hardhat.hethers.getContractAt('MultiRewards', campaign);

    console.log('⚙️ Enabling reward...');
    await multiRewards.enableReward(reward, duration);
    console.log('✅ Reward enabled');
}

module.exports = enableRewards;
