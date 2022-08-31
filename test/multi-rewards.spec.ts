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
    let lpToken: Contract;
    let staking: Contract;

    const REWARD_DURATION = 3600; // 1 hour in seconds
    const REWARD_WEIBARS = ethers.utils.parseUnits("8.6400", 18); // 8.6400 HBARs
    const REWARD_TINYBARS = ethers.utils.parseUnits("8.6400", 8);
    const REWARD_RATE = REWARD_TINYBARS.div(REWARD_DURATION); // 1 HBAR / sec

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
        const LPToken = await ethers.getContractFactory('MockLPToken');
        let lpTokenDeployment = await LPToken.deploy();
        const { contractAddress: lpAddress } = await lpTokenDeployment.deployTransaction.wait();
        lpToken = await ethers.getContractAt('MockLPToken', lpAddress);
    });

    beforeEach(async () => {
        const deployTx = await factory.deploy(owner.address, lpToken.address);
        const minedTx = await deployTx.wait();
        const stakingAddress = minedTx.events[1].args.campaign;
        staking = await ethers.getContractAt('MultiRewards', stakingAddress);
    });

    it('should initialise properties on deployment', async () => {
        expect(await staking.stakingToken()).to.equal(lpToken.address);
        expect(await staking.WHBAR()).to.equal(whbar.address);
    })

    describe('Owner', () => {

        it('Should set owner to deployer', async () => {
            expect(await staking.owner()).to.equal(owner.address);
        });

        it('Should allow owner to pause', async () => {
            await expect(staking.setPaused(true))
                .to.emit(staking, 'PauseChanged').withArgs(true);
        });

        it('Should allow owner to unpause', async () => {
            const tx = await staking.setPaused(true);
            await tx.wait();
            await expect(staking.setPaused(false))
                .to.emit(staking, 'PauseChanged').withArgs(false);
        });

        it('Should not allow non-owner to pause', async () => {
            await expectRevert(await staking.connect(staker).setPaused(true));
        });

        it('Should not allow non-owner to unpause', async () => {
            const tx = await staking.setPaused(true);
            await tx.wait();
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

    describe('WHBAR Campaign', () => {

        it('should enable WHBAR reward properly', async () => {
            await expect(staking.enableReward(whbar.address, REWARD_DURATION))
                .to.emit(staking, 'RewardEnabled')
                .withArgs(whbar.address, REWARD_DURATION)

            expect((await staking.rewardData(whbar.address))['rewardsDuration']).to.equal(REWARD_DURATION);
            expect(await staking.rewardTokens(0)).to.equal(whbar.address);
        });

        it('non-owner should not be able to enable rewards', async () => {
            await expectRevert(await staking.connect(staker).enableReward(whbar.address, REWARD_DURATION));
        })

        // it.only('Should not update rewards duration if previous reward period as not finished', async () => {
        //     await staking.notifyRewardAmount(whbar.address, REWARD_TINYBARS);
        //     await expectRevert(await staking.setRewardsDuration(whbar.address, REWARD_DURATION + 1));
        // });

        describe('', () => {

            beforeEach(async () => {
                // THIS VALUE IS IN WEIBARS not TINYBARS!!!
                const depositTx = await whbar.deposit({ value: REWARD_WEIBARS });
                await depositTx.wait();

                const approveTx = await whbar.approve(staking.address, REWARD_TINYBARS);
                await approveTx.wait();

                const enableTx = await staking.enableReward(whbar.address, REWARD_DURATION);
                await enableTx.wait();
            });

            it('should emit correct events on notify and send reward amount', async () => {
                await expect(staking.notifyRewardAmount(whbar.address, REWARD_TINYBARS))
                    .to.emit(staking, 'RewardAdded')
                    .withArgs(whbar.address, REWARD_TINYBARS, REWARD_DURATION)
                    .to.emit(whbar, 'Transfer')
                    .withArgs(owner.address, staking.address, REWARD_TINYBARS);
            });

            it('should notify and send reward amount', async () => {
                const tx = await staking.notifyRewardAmount(whbar.address, REWARD_TINYBARS);
                await tx.wait();
                const block = await ethers.provider.getBlock(tx.blockNumber);

                const rewardData = await staking.rewardData(whbar.address);
                expect(rewardData.rewardRate).to.equal(REWARD_RATE);
                expect(rewardData.lastUpdateTime).to.equal(block.timestamp);
                expect(rewardData.periodFinish).to.equal(block.timestamp + REWARD_DURATION);
            });

            describe('Staking', () => {

                beforeEach(async () => {
                    await staking.notifyRewardAmount(whbar.address, REWARD_TINYBARS);
                })

                it('Should stake LP Token successfully', async () => {
                    const mintTx = await lpToken.mint(staker.address, 1);
                    await mintTx.wait();
                    const approveTx = await lpToken.connect(staker).approve(staking.address, 1);
                    await approveTx.wait();

                    const stakeTx = await staking.connect(staker).stake(1);
                    await stakeTx.wait();

                    const balanceOfStaking = await lpToken.balanceOf(staking.address);
                    expect(balanceOfStaking.toNumber()).to.equal(1);
                    expect(await staking.totalSupply()).to.equal(1);
                    expect(await staking.balanceOf(staker.address)).to.equal(1);
                });

                it.only('Should update fields correctly on second time staking', async () => {
                    const mintTx = await lpToken.mint(staker.address, 2);
                    await mintTx.wait();
                    const approveTx = await lpToken.connect(staker).approve(staking.address, 2);
                    await approveTx.wait();

                    const stakeTx = await staking.connect(staker).stake(1);
                    await stakeTx.wait();
                    const balanceOfStaking = await lpToken.balanceOf(staking.address);
                    expect(balanceOfStaking.toNumber()).to.equal(1);

                    const stake2Tx = await staking.connect(staker).stake(1);
                    await stake2Tx.wait();
                    const secondBalance = await lpToken.balanceOf(staking.address);
                    expect(secondBalance.toNumber()).to.equal(2);
                    expect(await staking.totalSupply()).to.equal(2);
                    expect(await staking.balanceOf(staker.address)).to.equal(2);
                });

            })

        })



    })

});
