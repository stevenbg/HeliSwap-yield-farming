import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Utils } from '../utils/utils';
import expectRevert = Utils.expectRevert;

describe('MultiRewards', () => {

    let owner: SignerWithAddress, staker: SignerWithAddress, nonStaker: SignerWithAddress,
        anotherStaker: SignerWithAddress;
    let factory: Contract;
    let whbar: Contract;
    let staking: Contract;

    const REWARD_DURATION = 2_629_743; // 1 month in seconds

    before(async () => {
        const signers = await ethers.getSigners();
        owner = signers[0];
        staker = signers[1];
        nonStaker = signers[2];
        anotherStaker = signers[3];

        // 1. Deploy WHBAR
        const WHBAR = await ethers.getContractFactory('MockWHBAR');
        let whbarDeployment = await WHBAR.deploy();
        const { contractAddress: whbarAddress } = await whbarDeployment.deployTransaction.wait();
        whbar = await ethers.getContractAt('MockWHBAR', whbarAddress);

        // 2. Deploy Factory
        const Factory = await ethers.getContractFactory('Factory');
        let factoryDeployment = await Factory.deploy(whbarAddress);
        const { contractAddress: factoryAddress } = await factoryDeployment.deployTransaction.wait();
        factory = await ethers.getContractAt('Factory', factoryAddress);

        // 3. Deploy Mock LP Token
        // TODO
    });

    beforeEach(async () => {
        await factory.deploy(owner.address, ethers.constants.AddressZero);
        let allCampaigns = await factory.getCampaignsLength();
        let stakingAddress = await factory.campaigns(parseInt(allCampaigns) - 1);
        staking = await ethers.getContractAt('MultiRewards', stakingAddress);
    });

    describe('Owner', () => {

        it('Should set owner to deployer', async () => {
            expect(await staking.owner()).to.equal(owner.address);
        });

        it('Should allow owner to pause', async () => {
            await expect(staking.setPaused(true))
                .to.emit(staking, 'PauseChanged').withArgs(true);
        });

        it('Should allow owner to unpause', async () => {
            await staking.setPaused(true);
            await expect(staking.setPaused(false))
                .to.emit(staking, 'PauseChanged').withArgs(false);
        });

        it('Should not allow non-owner to pause', async () => {
            await expectRevert(await staking.connect(staker).setPaused(true));
        });

        it('Should not allow non-owner to unpause', async () => {
            await staking.setPaused(true);
            await expectRevert(await staking.connect(staker).setPaused(false));
        });

        it('Should not allow non-owner to change rewardsDuration', async () => {
            await expectRevert(await staking.connect(staker)
                .setRewardsDuration(ethers.constants.AddressZero, REWARD_DURATION));
        });

        it('Should not allow non-owner to notifyRewardAmount', async () => {
            await expectRevert(await staking.connect(staker).notifyRewardAmount(ethers.constants.AddressZero, 1));
        });

    });

});
