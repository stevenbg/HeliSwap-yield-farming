// @ts-nocheck
import hardhat from 'hardhat';

async function deployCampaignFromFactory(factory: string, owner: string, token: string) {
  const Factory = await hardhat.hethers.getContractAt('Factory', factory);

  console.log('⚙️ Deploying MultiRewards contract ...');

  const deployTx = await Factory.deploy(owner, token, { gasLimit: 3_000_000 });
  await deployTx.wait();

  const numberOfCampaignsStr = await Factory.getCampaignsLength({ gasLimit: 50_000 });
  const numberOfCampaigns = parseInt(numberOfCampaignsStr);

  const campaign = await Factory.campaigns(numberOfCampaigns - 1, { gasLimit: 50_000 });
  console.log('✅ MultiRewards contract deployed to:', campaign);
  return campaign;
}

module.exports = deployCampaignFromFactory;
