import { expect } from 'chai';
import { ethers } from 'hardhat';
import { smock } from '@defi-wonderland/smock';

describe.only('MultiRewards', function () {
    this.timeout(60_000);

    let signers: any;
    let factory: any;
    let whbar: any;
    let lpToken: any;
    let staking: any;
    let campaign: any;
    let feeAsset: any;
    let pool: any;
    let poolsFactory: any;
    let tokenA: any;
    let tokenB: any;

    const FEE = ethers.utils.parseEther('1');

    beforeEach(async () => {
        signers = await ethers.getSigners();
        const optimisticContract = await smock.fake([
            {
                'inputs': [
                    {
                        'internalType': 'address',
                        'name': 'associatee',
                        'type': 'address'
                    },
                    {
                        'internalType': 'address',
                        'name': 'token',
                        'type': 'address'
                    }
                ],
                'name': 'associateToken',
                'outputs': [
                    {
                        'internalType': 'uint256',
                        'name': '',
                        'type': 'uint256'
                    }
                ],
                'stateMutability': 'nonpayable',
                'type': 'function'
            }
        ],
            {
                address: '0x0000000000000000000000000000000000000167',
            });

        // // @ts-ignore
        optimisticContract.associateToken.returns(167);

        const whbarFactory = await ethers.getContractFactory('MockWHBAR');
        whbar = await (await whbarFactory.deploy()).deployed();

        const tokenFactory = await ethers.getContractFactory('MockToken');
        pool = await (await tokenFactory.deploy()).deployed();
        feeAsset = await (await tokenFactory.deploy()).deployed();
        tokenA = await (await tokenFactory.deploy()).deployed();
        tokenB = await (await tokenFactory.deploy()).deployed();

        poolsFactory = await smock.fake([
            {
                'inputs': [
                    {
                        'internalType': 'address',
                        'name': '',
                        'type': 'address'
                    },
                    {
                        'internalType': 'address',
                        'name': '',
                        'type': 'address'
                    }
                ],
                'name': 'getPair',
                'outputs': [
                    {
                        'internalType': 'address',
                        'name': '',
                        'type': 'address'
                    }
                ],
                'stateMutability': 'view',
                'type': 'function'
            },
        ]);

        // @ts-ignore
        poolsFactory.getPair.returns(pool.address);

        const Factory = await ethers.getContractFactory('Factory');
        factory = await (await Factory.deploy(
            whbar.address, FEE, feeAsset.address, poolsFactory.address
        )).deployed();

        await factory.deploy(tokenA.address, tokenB.address);

        campaign = await ethers.getContractAt('MultiRewards', await factory.campaigns(0));
    });

    describe('Deployment', () => {
        it('Should be deployed correctly', async () => {
            expect(await campaign.stakingToken()).to.be.equal(pool.address);
            expect(await campaign.WHBAR()).to.be.equal(whbar.address);
            expect(await campaign.whitelistedRewardTokens(tokenA.address)).to.be.equal(true);
            expect(await campaign.whitelistedRewardTokens(tokenB.address)).to.be.equal(true);
            expect(await campaign.factory()).to.be.equal(factory.address);
        });
    });

    describe('Enable campaign', () => {
        it('Should set campaign duration', async () => {
            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaign.address, FEE);

            await campaign.enableReward(2);
            expect(await campaign.rewardsDuration()).to.be.equal(2 * 30 * 24 * 60 * 60);
        });

        it('Should revert in case the campaign is running', async () => {
            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaign.address, FEE);

            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('1'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('1'));

            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('1'));

            await expect(campaign.enableReward(2)).to.be.revertedWith('Reward period still active');
        });

        it('Should revert in case the duration is zero or more than a year', async () => {
            await expect(campaign.enableReward(0)).to.be.revertedWith('Reward duration out of range');
            await expect(campaign.enableReward(13)).to.be.revertedWith('Reward duration out of range');
        });

        it('Should revert in case the fee is not paid', async () => {
            await expect(campaign.enableReward(3)).to.be.revertedWith('TransferFrom: Failed');
        });
    });

    describe('Notify campaign', () => {
        it('Should run a campaign', async () => {
            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaign.address, FEE);
            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('1'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('1'));

            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('1'));

            const blockStamp = (await ethers.provider.getBlock('latest')).timestamp;
            const data = await campaign.rewardData(tokenA.address);
            expect(data[0]).to.be.equal(ethers.utils.parseEther('1').div(2 * 30 * 24 * 60 * 60));
            expect(data[1]).to.be.equal(await campaign.periodFinish());
            expect(data[2]).to.be.equal(blockStamp);
            expect(data[3]).to.be.equal(0);

            expect(await campaign.rewardTokens(0)).to.be.equal(tokenA.address);
            expect(await campaign.hasRewardTokenAdded(tokenA.address)).to.be.equal(true);

            expect(await feeAsset.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await feeAsset.balanceOf(factory.address)).to.be.equal(FEE);

            expect(await tokenA.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await tokenA.balanceOf(campaign.address)).to.be.equal(ethers.utils.parseEther('1'));
        });

        it('Should extend a campaign', async () => {
            await feeAsset.mint(signers[0].address, FEE.mul(2));
            await feeAsset.approve(campaign.address, FEE.mul(2));
            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('1'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('1'));
            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('1'));

            await ethers.provider.send('evm_increaseTime', [60 * 24 * 60 * 60]); // skip 2 months
            await ethers.provider.send('evm_mine', []);

            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('15'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('15'));
            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('15'));

            const blockStamp = (await ethers.provider.getBlock('latest')).timestamp;
            const data = await campaign.rewardData(tokenA.address);
            expect(data[0]).to.be.equal(ethers.utils.parseEther('15').div(60 * 24 * 60 * 60));
            expect(data[1]).to.be.equal(await campaign.periodFinish());
            expect(data[2]).to.be.equal(blockStamp);
            expect(data[3]).to.be.equal(0);

            expect(await campaign.rewardTokens(0)).to.be.equal(tokenA.address);
            expect(await campaign.hasRewardTokenAdded(tokenA.address)).to.be.equal(true);

            expect(await feeAsset.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await feeAsset.balanceOf(factory.address)).to.be.equal(FEE.mul(2));

            expect(await tokenA.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await tokenA.balanceOf(campaign.address)).to.be.equal(ethers.utils.parseEther('16'));
        });

        it('Should add multiple reward tokens for a single campaign', async () => {
            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaign.address, FEE);
            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('1'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('1'));
            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('1'));

            let blockStamp = (await ethers.provider.getBlock('latest')).timestamp;
            let data = await campaign.rewardData(tokenA.address);
            expect(data[0]).to.be.equal(ethers.utils.parseEther('1').div(2 * 30 * 24 * 60 * 60));
            expect(data[1]).to.be.equal(await campaign.periodFinish());
            expect(data[2]).to.be.equal(blockStamp);
            expect(data[3]).to.be.equal(0);

            expect(await campaign.rewardTokens(0)).to.be.equal(tokenA.address);
            expect(await campaign.hasRewardTokenAdded(tokenA.address)).to.be.equal(true);

            expect(await tokenA.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await tokenA.balanceOf(campaign.address)).to.be.equal(ethers.utils.parseEther('1'));

            await tokenB.mint(signers[0].address, ethers.utils.parseEther('1'));
            await tokenB.approve(campaign.address, ethers.utils.parseEther('1'));
            await campaign.notifyRewardAmount(tokenB.address, ethers.utils.parseEther('1'));

            blockStamp = (await ethers.provider.getBlock('latest')).timestamp;
            data = await campaign.rewardData(tokenB.address);
            expect(data[0]).to.be.equal(
                ethers.utils.parseEther('1')
                    .div(
                        await campaign.periodFinish() - blockStamp
                    )
            );
            expect(data[1]).to.be.equal(await campaign.periodFinish());
            expect(data[2]).to.be.equal(blockStamp);
            expect(data[3]).to.be.equal(0);

            expect(await campaign.rewardTokens(1)).to.be.equal(tokenB.address);
            expect(await campaign.hasRewardTokenAdded(tokenB.address)).to.be.equal(true);

            expect(await tokenB.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await tokenB.balanceOf(campaign.address)).to.be.equal(ethers.utils.parseEther('1'));

        });

        it('Should add a few times rewards for a given token in single campaign run', async () => {
            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaign.address, FEE);
            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('1'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('1'));
            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('1'));

            const rewardRate = (await campaign.rewardData(tokenA.address))[0];
            await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('1'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('1'));
            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('1'));

            const blockStamp = (await ethers.provider.getBlock('latest')).timestamp;
            const data = await campaign.rewardData(tokenA.address);
            const leftOver = rewardRate.mul(await campaign.periodFinish() - blockStamp);
            expect(data[0]).to.be.equal(
                leftOver.add(ethers.utils.parseEther('1')).div(await campaign.periodFinish() - blockStamp)
            );
            expect(data[1]).to.be.equal(await campaign.periodFinish());
            expect(data[2]).to.be.equal(blockStamp);
            expect(data[3]).to.be.equal(0);

            expect(await campaign.rewardTokens(0)).to.be.equal(tokenA.address);
            expect(await campaign.hasRewardTokenAdded(tokenA.address)).to.be.equal(true);

            expect(await tokenA.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await tokenA.balanceOf(campaign.address)).to.be.equal(ethers.utils.parseEther('2'));
        });

        it('Should revert if the campaign has not been configured yet', async () => {
            await expect(
                campaign.notifyRewardAmount(ethers.constants.AddressZero, ethers.utils.parseEther('1'))
            ).to.be.revertedWith('Campaign not configured yet');
        });

        it('Should revert if the rewards token is not a whitelisted one', async () => {
            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaign.address, FEE);
            await campaign.enableReward(2);

            await expect(
                campaign.notifyRewardAmount(ethers.constants.AddressZero, ethers.utils.parseEther('1'))
            ).to.be.revertedWith('Not whitelisted reward token');
        });

        it('Should revert if the amount of rewards is too little making the rate 0', async () => {
            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaign.address, FEE);
            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('1'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('1'));

            await expect(
                campaign.notifyRewardAmount(tokenA.address, 10)
            ).to.be.revertedWith('Too little rewards for the duration');
        });
    });

    describe('Stake', () => {
        it('Should stake successfully', async () => {
            const stake = ethers.utils.parseEther('1');
            await pool.mint(signers[0].address, stake);
            await pool.approve(campaign.address, stake);

            await campaign.stake(stake);

            expect(await pool.balanceOf(signers[0].address)).to.be.equal(0);
            expect(await pool.balanceOf(campaign.address)).to.be.equal(stake);
            expect(await campaign.totalSupply()).to.be.equal(stake);
            expect(await campaign.balanceOf(signers[0].address)).to.be.equal(stake);
        });

        it('Should stake twice', async () => {
            const stake = ethers.utils.parseEther('1');

            await pool.mint(signers[0].address, stake);
            await pool.approve(campaign.address, stake);
            await campaign.stake(stake);

            await pool.mint(signers[0].address, stake);
            await pool.approve(campaign.address, stake);
            await campaign.stake(stake);

            expect(await pool.balanceOf(signers[0].address)).to.be.equal(0);
            expect(await pool.balanceOf(campaign.address)).to.be.equal(stake.mul(2));
            expect(await campaign.totalSupply()).to.be.equal(stake.mul(2));
            expect(await campaign.balanceOf(signers[0].address)).to.be.equal(stake.mul(2));
        });

        it('Should revert staking amount is missing', async () => {
            await expect(
                campaign.stake(10)
            ).to.be.revertedWith('TransferFrom: Failed');
        });

        it('Should revert when amount is 0', async () => {
            await expect(
                campaign.stake(0)
            ).to.be.revertedWith('Cannot withdraw 0');
        });
    });

    describe('Withdraw', () => {
        it('Should withdraw successfully', async () => {
            const stake = ethers.utils.parseEther('1');
            await pool.mint(signers[0].address, stake);
            await pool.approve(campaign.address, stake);

            await campaign.stake(stake);
            await campaign.withdraw(stake);

            expect(await pool.balanceOf(signers[0].address)).to.be.equal(stake);
            expect(await pool.balanceOf(campaign.address)).to.be.equal(0);
            expect(await campaign.totalSupply()).to.be.equal(0);
            expect(await campaign.balanceOf(signers[0].address)).to.be.equal(0);
        });

        it('Should withdraw multiple times', async () => {
            const stake = ethers.utils.parseEther('2');

            await pool.mint(signers[0].address, stake);
            await pool.approve(campaign.address, stake);
            await campaign.stake(stake);

            await campaign.withdraw(stake.div(2));
            await campaign.withdraw(stake.div(2));

            expect(await pool.balanceOf(signers[0].address)).to.be.equal(stake);
            expect(await pool.balanceOf(campaign.address)).to.be.equal(0);
            expect(await campaign.totalSupply()).to.be.equal(0);
            expect(await campaign.balanceOf(signers[0].address)).to.be.equal(0);
        });

        it('Should revert when amount is 0', async () => {
            await expect(campaign.withdraw(0)).to.be.revertedWith('Cannot stake 0');
        });
    });

    describe('Accumulate rewards', () => {
        it('Should not get rewards when there is no a campaign running', async () => {
            const stake = ethers.utils.parseEther('2');

            await pool.mint(signers[0].address, stake);
            await pool.approve(campaign.address, stake);
            await campaign.stake(stake);

            await campaign.getReward();
        });

        it('Should get ERC20 token rewards', async () => {
            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaign.address, FEE);
            await campaign.enableReward(2);

            const rewards = ethers.utils.parseEther('1');
            await tokenA.mint(signers[0].address, rewards);
            await tokenA.approve(campaign.address, rewards);

            await campaign.notifyRewardAmount(tokenA.address, rewards);

            const stake = ethers.utils.parseEther('2');
            await pool.mint(signers[0].address, stake);
            await pool.approve(campaign.address, stake);
            await campaign.stake(stake);

            const stakeStamp = (await ethers.provider.getBlock('latest')).timestamp;

            await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            await campaign.getReward();

            const rewardsStamp = (await ethers.provider.getBlock('latest')).timestamp;
            const stampDiff = rewardsStamp - stakeStamp;

            const rewardsData = await campaign.rewardData(tokenA.address);
            const rewardsAccumulated = rewardsData.rewardRate.mul(stampDiff);

            expect(await tokenA.balanceOf(signers[0].address)).to.be.closeTo(rewardsAccumulated, 1); // 1 wei difference
            expect(await tokenA.balanceOf(campaign.address)).to.be.closeTo(rewards.sub(rewardsAccumulated), 1); // 1 wei difference

            expect(rewardsData.lastUpdateTime).to.be.equal(rewardsStamp);
            expect(rewardsData.rewardPerTokenStored).to.be.equal(rewardsAccumulated.div(2)); // total supply
            expect(await campaign.userRewardPerTokenPaid(signers[0].address, tokenA.address)).to.be.equal(rewardsAccumulated.div(2));
        });

        it('Should get HBAR rewards', async () => {
            const Factory = await ethers.getContractFactory('Factory');
            const factoryHBAR = await (await Factory.deploy(
                whbar.address, FEE, feeAsset.address, poolsFactory.address
            )).deployed();

            await factoryHBAR.deploy(whbar.address, tokenB.address);
            const campaignHBAR = await ethers.getContractAt('MultiRewards', await factoryHBAR.campaigns(0));

            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaignHBAR.address, FEE);
            await campaignHBAR.enableReward(2);

            const rewards = ethers.utils.parseEther("1");
            await whbar.deposit({ value: rewards });
            await whbar.approve(campaignHBAR.address, rewards);

            await campaignHBAR.notifyRewardAmount(whbar.address, rewards);

            const stake = ethers.utils.parseEther('2');
            await pool.mint(signers[0].address, stake);
            await pool.approve(campaignHBAR.address, stake);
            await campaignHBAR.stake(stake);

            const stakeStamp = (await ethers.provider.getBlock('latest')).timestamp;

            await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            const balanceBefore = await ethers.provider.getBalance(signers[0].address);
            await campaignHBAR.getReward();
            const balanceAfter = await ethers.provider.getBalance(signers[0].address);

            const rewardsStamp = (await ethers.provider.getBlock('latest')).timestamp;
            const stampDiff = rewardsStamp - stakeStamp;

            const rewardsData = await campaignHBAR.rewardData(whbar.address);
            const rewardsAccumulated = rewardsData.rewardRate.mul(stampDiff);

            expect(balanceBefore).to.be.lt(balanceAfter);
            expect(await whbar.balanceOf(campaignHBAR.address)).to.be.closeTo(rewards.sub(rewardsAccumulated), 1); // 1 wei difference

            expect(rewardsData.lastUpdateTime).to.be.equal(rewardsStamp);
            expect(rewardsData.rewardPerTokenStored).to.be.equal(rewardsAccumulated.div(2)); // total supply
            expect(await campaignHBAR.userRewardPerTokenPaid(signers[0].address, whbar.address)).to.be.equal(rewardsAccumulated.div(2));
        });

        it('Should get multiple tokens rewards', async () => {
            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaign.address, FEE);
            await campaign.enableReward(2);

            const rewards = ethers.utils.parseEther('1');
            await tokenA.mint(signers[0].address, rewards);
            await tokenA.approve(campaign.address, rewards);

            await tokenB.mint(signers[0].address, rewards.mul(15));
            await tokenB.approve(campaign.address, rewards.mul(15));

            await campaign.notifyRewardAmount(tokenA.address, rewards);
            await campaign.notifyRewardAmount(tokenB.address, rewards.mul(15));

            const stake = ethers.utils.parseEther('2');
            await pool.mint(signers[0].address, stake);
            await pool.approve(campaign.address, stake);
            await campaign.stake(stake);

            const stakeStamp = (await ethers.provider.getBlock('latest')).timestamp;

            await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            await campaign.getReward();

            const rewardsStamp = (await ethers.provider.getBlock('latest')).timestamp;
            const stampDiff = rewardsStamp - stakeStamp;

            const rewardsDataA = await campaign.rewardData(tokenA.address);
            const rewardsDataB = await campaign.rewardData(tokenB.address);
            const rewardsAccumulatedA = rewardsDataA.rewardRate.mul(stampDiff);
            const rewardsAccumulatedB = rewardsDataB.rewardRate.mul(stampDiff);

            expect(await tokenA.balanceOf(signers[0].address)).to.be.closeTo(rewardsAccumulatedA, 1);
            expect(await tokenA.balanceOf(campaign.address)).to.be.closeTo(rewards.sub(rewardsAccumulatedA), 1);
            expect(await tokenB.balanceOf(signers[0].address)).to.be.closeTo(rewardsAccumulatedB, 1);
            expect(await tokenB.balanceOf(campaign.address)).to.be.closeTo(rewards.mul(15).sub(rewardsAccumulatedB), 1);

            expect(rewardsDataA.lastUpdateTime).to.be.equal(rewardsStamp);
            expect(rewardsDataA.rewardPerTokenStored).to.be.equal(rewardsAccumulatedA.div(2));
            expect(rewardsDataB.lastUpdateTime).to.be.equal(rewardsStamp);
            expect(rewardsDataB.rewardPerTokenStored).to.be.equal(rewardsAccumulatedB.div(2));

            expect(await campaign.userRewardPerTokenPaid(signers[0].address, tokenA.address)).to.be.equal(rewardsAccumulatedA.div(2));
            expect(await campaign.userRewardPerTokenPaid(signers[0].address, tokenB.address)).to.be.equal(rewardsAccumulatedB.div(2));
        });

        it.only('Should get multiple tokens rewards for multiple users', async () => {
            await feeAsset.mint(signers[0].address, FEE);
            await feeAsset.approve(campaign.address, FEE);
            await campaign.enableReward(2);

            const rewards = ethers.utils.parseEther('1');
            await tokenA.mint(signers[0].address, rewards);
            await tokenA.approve(campaign.address, rewards);

            await tokenB.mint(signers[0].address, rewards.mul(15));
            await tokenB.approve(campaign.address, rewards.mul(15));

            await campaign.notifyRewardAmount(tokenA.address, rewards);
            await campaign.notifyRewardAmount(tokenB.address, rewards.mul(15));

            const stake = ethers.utils.parseEther('2');
            await pool.mint(signers[0].address, stake);
            await pool.approve(campaign.address, stake);
            await campaign.stake(stake);

            const stakeStampUser1 = (await ethers.provider.getBlock('latest')).timestamp;

            await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            const stake2 = ethers.utils.parseEther('3')
            await pool.mint(signers[1].address, stake2);
            await pool.connect(signers[1]).approve(campaign.address, stake2);
            await campaign.connect(signers[1]).stake(stake2);

            const stakeStampUser2 = (await ethers.provider.getBlock('latest')).timestamp;

            const rewardRateA = (await campaign.rewardData(tokenA.address))[0];
            const rewardRateB = (await campaign.rewardData(tokenB.address))[0];
            let rewardsSoFarAUser1 = rewardRateA.mul(stakeStampUser2 - stakeStampUser1);
            let rewardsSoFarBUser1 = rewardRateB.mul(stakeStampUser2 - stakeStampUser1);

            await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            await campaign.getReward();
            const rewardsStampUser1 = (await ethers.provider.getBlock('latest')).timestamp;

            await campaign.connect(signers[1]).getReward();
            const rewardsStampUser2 = (await ethers.provider.getBlock('latest')).timestamp;

            const rewardsAccumulatedAUser1 = rewardsSoFarAUser1.add(rewardRateA.mul(rewardsStampUser1 - stakeStampUser2).mul(2).div(5));
            const rewardsAccumulatedBUser1 = rewardsSoFarBUser1.add(rewardRateB.mul(rewardsStampUser1 - stakeStampUser2).mul(2).div(5));

            const rewardsAccumulatedAUser2 = rewardRateA.mul(rewardsStampUser2 - stakeStampUser2).mul(3).div(5);
            const rewardsAccumulatedBUser2 = rewardRateB.mul(rewardsStampUser2 - stakeStampUser2).mul(3).div(5);

            // User 1
            expect(await tokenA.balanceOf(signers[0].address)).to.be.closeTo(rewardsAccumulatedAUser1, 1);
            expect(await tokenB.balanceOf(signers[0].address)).to.be.closeTo(rewardsAccumulatedBUser1, 1);

            // User 2
            expect(await tokenA.balanceOf(signers[1].address)).to.be.closeTo(rewardsAccumulatedAUser2, 5);
            expect(await tokenB.balanceOf(signers[1].address)).to.be.closeTo(rewardsAccumulatedBUser2, 5);

            // // Campaign balances
            expect(await tokenA.balanceOf(campaign.address)).to.be.closeTo(rewards.sub(rewardsAccumulatedAUser1.add(rewardsAccumulatedAUser2)), 5);
            expect(await tokenB.balanceOf(campaign.address)).to.be.closeTo(rewards.mul(15).sub(rewardsAccumulatedBUser1.add(rewardsAccumulatedBUser2)), 5);


            // expect(rewardsDataA.lastUpdateTime).to.be.equal(rewardsStamp);
            // expect(rewardsDataA.rewardPerTokenStored).to.be.equal(rewardsAccumulatedA.div(2));
            // expect(rewardsDataB.lastUpdateTime).to.be.equal(rewardsStamp);
            // expect(rewardsDataB.rewardPerTokenStored).to.be.equal(rewardsAccumulatedB.div(2));
            // Todo: Fix it
            expect(await campaign.userRewardPerTokenPaid(signers[0].address, tokenA.address)).to.be.equal(rewardsAccumulatedAUser1.div(2));
            expect(await campaign.userRewardPerTokenPaid(signers[0].address, tokenB.address)).to.be.equal(rewardsAccumulatedBUser1.div(2));
            expect(await campaign.userRewardPerTokenPaid(signers[1].address, tokenA.address)).to.be.equal(rewardsAccumulatedAUser2.div(3));
            expect(await campaign.userRewardPerTokenPaid(signers[1].address, tokenB.address)).to.be.equal(rewardsAccumulatedBUser2.div(3));
        });
    });

    describe('Exit', () => {
        it('Should withdraw and get rewards at once', async () => {
        });
    });

    describe('Pause', () => {
        it('Should pause a campaign', async () => {
            await campaign.pause();

            await expect(campaign.stake(1)).to.be.revertedWith('Pausable: paused');
            expect(await campaign.paused()).to.be.equal(true);
        });
    });

    describe('UnPause', () => {
        it('Should unpause a campaign', async () => {
            await campaign.pause();
            await campaign.unpause();

            expect(await campaign.paused()).to.be.equal(false);
        });
    });

    describe('Flows', () => {
        xit('Should extend a campaign and user keeps rewards from the first run', async () => {
            await feeAsset.mint(signers[0].address, FEE.mul(2));
            await feeAsset.approve(campaign.address, FEE.mul(2));
            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('1'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('1'));
            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('1'));

            await ethers.provider.send('evm_increaseTime', [60 * 24 * 60 * 60]); // skip 2 months
            await ethers.provider.send('evm_mine', []);

            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('15'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('15'));
            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('15'));

            const blockStamp = (await ethers.provider.getBlock('latest')).timestamp;
            const data = await campaign.rewardData(tokenA.address);
            expect(data[0]).to.be.equal(ethers.utils.parseEther('15').div(60 * 24 * 60 * 60));
            expect(data[1]).to.be.equal(await campaign.periodFinish());
            expect(data[2]).to.be.equal(blockStamp);
            expect(data[3]).to.be.equal(0);

            expect(await campaign.rewardTokens(0)).to.be.equal(tokenA.address);
            expect(await campaign.hasRewardTokenAdded(tokenA.address)).to.be.equal(true);

            expect(await feeAsset.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await feeAsset.balanceOf(factory.address)).to.be.equal(FEE.mul(2));

            expect(await tokenA.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await tokenA.balanceOf(campaign.address)).to.be.equal(ethers.utils.parseEther('16'));
        });

        xit('Should extend a campaign and user entering after it to receive nothing', async () => {
            await feeAsset.mint(signers[0].address, FEE.mul(2));
            await feeAsset.approve(campaign.address, FEE.mul(2));
            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('1'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('1'));
            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('1'));

            await ethers.provider.send('evm_increaseTime', [60 * 24 * 60 * 60]); // skip 2 months
            await ethers.provider.send('evm_mine', []);

            await campaign.enableReward(2);

            await tokenA.mint(signers[0].address, ethers.utils.parseEther('15'));
            await tokenA.approve(campaign.address, ethers.utils.parseEther('15'));
            await campaign.notifyRewardAmount(tokenA.address, ethers.utils.parseEther('15'));

            const blockStamp = (await ethers.provider.getBlock('latest')).timestamp;
            const data = await campaign.rewardData(tokenA.address);
            expect(data[0]).to.be.equal(ethers.utils.parseEther('15').div(60 * 24 * 60 * 60));
            expect(data[1]).to.be.equal(await campaign.periodFinish());
            expect(data[2]).to.be.equal(blockStamp);
            expect(data[3]).to.be.equal(0);

            expect(await campaign.rewardTokens(0)).to.be.equal(tokenA.address);
            expect(await campaign.hasRewardTokenAdded(tokenA.address)).to.be.equal(true);

            expect(await feeAsset.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await feeAsset.balanceOf(factory.address)).to.be.equal(FEE.mul(2));

            expect(await tokenA.balanceOf(signers[2].address)).to.be.equal(0);
            expect(await tokenA.balanceOf(campaign.address)).to.be.equal(ethers.utils.parseEther('16'));
        });
    });
});
