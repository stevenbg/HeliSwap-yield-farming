// @ts-nocheck
import hardhat from 'hardhat';
const approveToken = require('./utils/approveToken');

async function extendCampaign(campaignAddress: string, token: string, duration: number, reward: number) {
    const campaign = await hardhat.hethers.getContractAt('MultiRewards', campaignAddress);

    // console.log('⚙️ Adjusting campaign duration...');
    // const tx = await campaign.setRewardsDuration(token, duration, {gasLimit: 150_000});
    // await tx.wait();
    // console.log('✅ Campaign duration adjusted...');

    // const tokenInstance = await hardhat.hethers.getContractAt('IWHBAR', token);

    // // THIS VALUE IS IN HBARS not TINYBARS!!!
    // const depositTx = await tokenInstance.deposit({ value: 400_000, gasLimit: 150_000 });
    // await depositTx.wait();
    // console.log(`Wrapped ${hbarAmount} of HBARs into tokenInstance`);

    // const approveTx = await tokenInstance.approve(campaignAddress, reward, { gasLimit: 500_000});
    // await approveTx.wait();
    // console.log(`Approved Campaign contract ${campaign} for ${reward} of WHBARs`);

    const deployer = (await hardhat.hethers.getSigners())[0];
    const deployerId = hardhat.hethers.utils.asAccountString(deployer.address);
    const deployerPk = deployer.identity.privateKey;

    const rewardId = hethers.utils.asAccountString(token);
    const campaignId = hethers.utils.asAccountString(campaignAddress);

    await approveToken(deployerId, deployerPk, campaignId, rewardId, reward);
    console.log(`Approved Campaign contract ${campaignAddress} for ${reward} of Reward`);

    const tx2 = await campaign.notifyRewardAmount(token, reward, {gasLimit: 300_000});
    await tx2.wait();
    console.log('New reward sent!');
}

module.exports = extendCampaign;
