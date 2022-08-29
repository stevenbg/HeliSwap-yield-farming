// @ts-nocheck
import hardhat from 'hardhat';

async function deployFactory() {
    const Factory = await hardhat.hethers.getContractFactory('Factory');

    console.log('⚙️ Deploying factory contract...');
    const factory = await Factory.deploy();
    await factory.deployed();

    console.log('✅ MultiRewards Factory contract deployed to:', factory.address);
}

module.exports = deployFactory;
