// import { ethers } from 'hardhat';
// import { expect } from 'chai';
// import { Contract } from 'ethers';
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// const IERC20 = require('../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json').abi;


// describe('MultiRewards', function () {
//     this.timeout(60_000);

//     let owner: SignerWithAddress, staker: SignerWithAddress, nonStaker: SignerWithAddress,
//         anotherStaker: SignerWithAddress;
//     let factory: Contract;
//     let whbar: Contract;
//     let lpToken: Contract;
//     let staking: Contract;

//     const REWARD_DURATION = 3600; // 1 hour in seconds
//     const REWARD_WEIBARS = ethers.utils.parseUnits('8.6400', 18); // 8.6400 HBARs
//     const REWARD_TINYBARS = ethers.utils.parseUnits('8.6400', 8);
//     const HBAR_REWARD_RATE = REWARD_TINYBARS.div(REWARD_DURATION); // 1 HBAR / sec

//     before(async () => {
//         const signers = await ethers.getSigners();
//         owner = signers[0];
//         staker = signers[1];
//         nonStaker = signers[2];
//         anotherStaker = signers[3];

//         // 1. Deploy WHBAR
//         const WHBAR = await ethers.getContractFactory('MockWHBAR');
//         let whbarDeployment = await WHBAR.deploy();
//         const { contractAddress: whbarAddress } = await whbarDeployment.deployTransaction.wait();
//         whbar = await ethers.getContractAt('MockWHBAR', whbarAddress);

//         // 2. Deploy Factory
//         const Factory = await ethers.getContractFactory('Factory');
//         let factoryDeployment = await Factory.deploy(whbarAddress);
//         const { contractAddress: factoryAddress } = await factoryDeployment.deployTransaction.wait();
//         factory = await ethers.getContractAt('Factory', factoryAddress);
//     });

//     beforeEach(async () => {
//         const LPToken = await ethers.getContractFactory('MockLPToken');
//         let lpTokenDeployment = await LPToken.deploy();
//         const { contractAddress: lpAddress } = await lpTokenDeployment.deployTransaction.wait();
//         lpToken = await ethers.getContractAt('MockLPToken', lpAddress);

//         const deployTx = await factory.deploy(owner.address, lpToken.address);
//         const minedTx = await deployTx.wait();
//         const stakingAddress = minedTx.events[1].args.campaign;
//         staking = await ethers.getContractAt('MultiRewards', stakingAddress);
//     });

//     it('should initialise properties on deployment', async () => {
//         expect(await staking.stakingToken()).to.equal(lpToken.address);
//         expect(await staking.WHBAR()).to.equal(whbar.address);
//     });

//     describe('Owner', () => {

//         it('Should set owner to deployer', async () => {
//             expect(await staking.owner()).to.equal(owner.address);
//         });

//         it('Should allow owner to pause', async () => {
//             await expect(staking.setPaused(true))
//                 .to.emit(staking, 'PauseChanged').withArgs(true);
//         });

//         it('Should allow owner to unpause', async () => {
//             const tx = await staking.setPaused(true);
//             await tx.wait();
//             await expect(staking.setPaused(false))
//                 .to.emit(staking, 'PauseChanged').withArgs(false);
//         });

//         it('Should not allow non-owner to pause', async () => {
//             await expectRevert(await staking.connect(staker).setPaused(true));
//         });

//         it('Should not allow non-owner to unpause', async () => {
//             const tx = await staking.setPaused(true);
//             await tx.wait();
//             await expectRevert(await staking.connect(staker).setPaused(false));
//         });

//         it('Should not allow non-owner to change rewardsDuration', async () => {
//             await expectRevert(await staking.connect(staker)
//                 .setRewardsDuration(ethers.constants.AddressZero, REWARD_DURATION));
//         });

//         it('Should not allow non-owner to notifyRewardAmount', async () => {
//             await expectRevert(await staking.connect(staker).notifyRewardAmount(ethers.constants.AddressZero, 1));
//         });

//     });

//     describe('WHBAR Campaign', () => {

//         it('should enable WHBAR reward properly', async () => {
//             await expect(staking.enableReward(whbar.address, false, REWARD_DURATION))
//                 .to.emit(staking, 'RewardEnabled')
//                 .withArgs(whbar.address, REWARD_DURATION);

//             expect((await staking.rewardData(whbar.address))['rewardsDuration']).to.equal(REWARD_DURATION);
//             expect(await staking.rewardTokens(0)).to.equal(whbar.address);
//         });

//         it('non-owner should not be able to enable rewards', async () => {
//             await expectRevert(await staking.connect(staker).enableReward(whbar.address, false, REWARD_DURATION));
//         });

//         describe('', () => {

//             beforeEach(async () => {
//                 // THIS VALUE IS IN WEIBARS not TINYBARS!!!
//                 const depositTx = await whbar.deposit({ value: REWARD_WEIBARS });
//                 await depositTx.wait();

//                 const approveTx = await whbar.approve(staking.address, REWARD_TINYBARS);
//                 await approveTx.wait();

//                 const enableTx = await staking.enableReward(whbar.address, false, REWARD_DURATION);
//                 await enableTx.wait();
//             });

//             it('should emit correct events on notify and send reward amount', async () => {
//                 await expect(staking.notifyRewardAmount(whbar.address, REWARD_TINYBARS))
//                     .to.emit(staking, 'RewardAdded')
//                     .withArgs(whbar.address, REWARD_TINYBARS, REWARD_DURATION)
//                     .to.emit(whbar, 'Transfer')
//                     .withArgs(owner.address, staking.address, REWARD_TINYBARS);
//             });

//             it('should notify and send reward amount', async () => {
//                 const tx = await staking.notifyRewardAmount(whbar.address, REWARD_TINYBARS);
//                 await tx.wait();
//                 const block = await ethers.provider.getBlock(tx.blockNumber);

//                 const rewardData = await staking.rewardData(whbar.address);
//                 expect(rewardData.rewardRate).to.equal(HBAR_REWARD_RATE);
//                 expect(rewardData.lastUpdateTime).to.equal(block.timestamp);
//                 expect(rewardData.periodFinish).to.equal(block.timestamp + REWARD_DURATION);
//             });

//             describe('Staking', () => {

//                 beforeEach(async () => {
//                     const notifyTx = await staking.notifyRewardAmount(whbar.address, REWARD_TINYBARS);
//                     await notifyTx.wait();
//                 });

//                 it('Should stake LP Token successfully', async () => {
//                     const mintTx = await lpToken.mint(staker.address, 1);
//                     await mintTx.wait();
//                     const approveTx = await lpToken.connect(staker).approve(staking.address, 1);
//                     await approveTx.wait();

//                     const stakeTx = await staking.connect(staker).stake(1);
//                     await stakeTx.wait();

//                     const balanceOfStaking = await lpToken.balanceOf(staking.address);
//                     expect(balanceOfStaking.toNumber()).to.equal(1);
//                     expect(await staking.totalSupply()).to.equal(1);
//                     expect(await staking.balanceOf(staker.address)).to.equal(1);
//                 });

//                 it('Should update fields correctly on second time staking', async () => {
//                     const mintTx = await lpToken.mint(staker.address, 2);
//                     await mintTx.wait();
//                     const approveTx = await lpToken.connect(staker).approve(staking.address, 2);
//                     await approveTx.wait();

//                     const stakeTx = await staking.connect(staker).stake(1);
//                     await stakeTx.wait();
//                     const balanceOfStaking = await lpToken.balanceOf(staking.address);
//                     expect(balanceOfStaking.toNumber()).to.equal(1);

//                     const stake2Tx = await staking.connect(staker).stake(1);
//                     await stake2Tx.wait();
//                     const secondBalance = await lpToken.balanceOf(staking.address);
//                     expect(secondBalance.toNumber()).to.equal(2);
//                     expect(await staking.totalSupply()).to.equal(2);
//                     expect(await staking.balanceOf(staker.address)).to.equal(2);
//                 });

//                 it('should emit events correctly', async () => {
//                     const mintTx = await lpToken.mint(staker.address, 1);
//                     await mintTx.wait();

//                     const approveTx = await lpToken.connect(staker).approve(staking.address, 1);
//                     await approveTx.wait();

//                     await expect(staking.connect(staker).stake(1))
//                         .to.emit(lpToken, 'Transfer')
//                         .withArgs(staker.address, staking.address, 1)
//                         .to.emit(staking, 'Staked')
//                         .withArgs(staker.address, 1, 1, 1);
//                 });

//                 it('should revert when transfer is invalid', async () => {
//                     const approveTx = await lpToken.connect(staker).approve(staking.address, 1);
//                     await approveTx.wait();

//                     await expectRevert(await staking.connect(staker).stake(1));
//                 });

//                 it('should not allow staking of 0 amount', async () => {
//                     await expectRevert(await staking.connect(staker).stake(0));
//                 });

//                 it('should not allow staking when paused', async () => {
//                     const pauseTx = await staking.setPaused(true);
//                     await pauseTx.wait();
//                     const mintTx = await lpToken.mint(staker.address, 1);
//                     await mintTx.wait();
//                     const approveTx = await lpToken.connect(staker).approve(staking.address, 1);
//                     await approveTx.wait();

//                     await expectRevert(await staking.connect(staker).stake(1));
//                 });
//             });

//             describe('Withdrawal', () => {

//                 const STAKE_AMOUNT = ethers.utils.parseEther('1');

//                 beforeEach(async () => {
//                     const notifyTx = await staking.notifyRewardAmount(whbar.address, REWARD_TINYBARS);
//                     await notifyTx.wait();
//                     const tx1 = await lpToken.mint(staker.address, STAKE_AMOUNT);
//                     await tx1.wait();
//                     const tx2 = await lpToken.connect(staker).approve(staking.address, STAKE_AMOUNT);
//                     await tx2.wait();
//                     const tx3 = await staking.connect(staker).stake(STAKE_AMOUNT);
//                     await tx3.wait();
//                 });

//                 it('should withdraw staked LP tokens successfully', async () => {
//                     const balanceOfStakingBefore = await lpToken.balanceOf(staking.address);
//                     expect(balanceOfStakingBefore).to.equal(STAKE_AMOUNT);
//                     expect(await staking.balanceOf(staker.address)).to.equal(STAKE_AMOUNT);
//                     expect(await staking.totalSupply()).to.equal(STAKE_AMOUNT);

//                     await staking.connect(staker).withdraw(STAKE_AMOUNT);
//                     const balanceOfStakingAfter = await lpToken.balanceOf(staking.address);
//                     expect(balanceOfStakingAfter).to.equal(0);

//                     const balanceOfStaker = await lpToken.balanceOf(staker.address);
//                     expect(balanceOfStaker).to.equal(STAKE_AMOUNT);
//                     expect(await staking.totalSupply()).to.equal(0);
//                     expect(await staking.balanceOf(staker.address)).to.equal(0);
//                 });

//                 it('should withdraw when paused', async () => {
//                     const pauseTx = await staking.setPaused(true);
//                     await pauseTx.wait();

//                     const withdrawTx = await staking.connect(staker).withdraw(STAKE_AMOUNT);
//                     await withdrawTx.wait();
//                 });

//                 it('should emit events correctly on Withdraw', async () => {
//                     await expect(staking.connect(staker).withdraw(STAKE_AMOUNT))
//                         .to.emit(lpToken, 'Transfer').withArgs(staking.address, staker.address, STAKE_AMOUNT)
//                         .to.emit(staking, 'Withdrawn').withArgs(staker.address, STAKE_AMOUNT, 0, 0);
//                 });

//                 it('should not allow withdrawing of no tokens', async () => {
//                     await expectRevert(await staking.connect(staker).withdraw(0));
//                 });
//             });

//             describe('Rewards', () => {

//                 beforeEach(async () => {
//                     const notifyTx = await staking.notifyRewardAmount(whbar.address, REWARD_TINYBARS);
//                     await notifyTx.wait();

//                     const tx1 = await lpToken.mint(staker.address, ethers.utils.parseEther('1'));
//                     await tx1.wait();
//                     const tx2 = await lpToken.connect(staker).approve(staking.address, ethers.utils.parseEther('1'));
//                     await tx2.wait();
//                 });

//                 it('should emit and send if no rewards have been accrued', async () => {
//                     await expect(staking.connect(staker).getReward())
//                         .to.not.emit(whbar, 'Withdrawal')
//                         .to.not.emit(staking, 'RewardPaid');
//                 });

//                 it('should accrue correct amount for one holder per second', async () => {
//                     const stakingWhbarBalanceBefore = await whbar.balanceOf(staking.address);
//                     const stakeTx = await staking.connect(staker).stake(1);
//                     await stakeTx.wait();
//                     const stakeBlock = await ethers.provider.getBlock(stakeTx.blockNumber);

//                     await sleep(1000);

//                     const getRewardTx = await staking.connect(staker).getReward();
//                     const rewardTx = await getRewardTx.wait();
//                     const rewardBlock = await ethers.provider.getBlock(getRewardTx.blockNumber);

//                     const elapsedSeconds = rewardBlock.timestamp - stakeBlock.timestamp;
//                     const expectedReward = HBAR_REWARD_RATE.mul(elapsedSeconds);
//                     const stakingWhbarBalanceAfter = await whbar.balanceOf(staking.address);
//                     expect(stakingWhbarBalanceBefore.sub(expectedReward)).to.equal(stakingWhbarBalanceAfter);
//                     expect(rewardTx.events[1].args.reward).to.equal(expectedReward);
//                 });

//                 it('should accrue correct amount of balance > 1 per second', async () => {
//                     const stakingWhbarBalanceBefore = await whbar.balanceOf(staking.address);
//                     const stakeTx = await staking.connect(staker).stake(ethers.utils.parseEther("1"));
//                     await stakeTx.wait();
//                     const stakeBlock = await ethers.provider.getBlock(stakeTx.blockNumber);

//                     await sleep(1000);

//                     const getRewardTx = await staking.connect(staker).getReward();
//                     const rewardTx = await getRewardTx.wait();
//                     const rewardBlock = await ethers.provider.getBlock(getRewardTx.blockNumber);

//                     const elapsedSeconds = rewardBlock.timestamp - stakeBlock.timestamp;
//                     const expectedReward = HBAR_REWARD_RATE.mul(elapsedSeconds);
//                     const stakingWhbarBalanceAfter = await whbar.balanceOf(staking.address);
//                     expect(stakingWhbarBalanceBefore.sub(expectedReward)).to.equal(stakingWhbarBalanceAfter);
//                     expect(rewardTx.events[1].args.reward).to.equal(expectedReward);
//                 });

//                 it('should accrue correct rewards for users proportionally to their balance', async () => {
//                     const mintTx = await lpToken.mint(anotherStaker.address, ethers.utils.parseEther('1'));
//                     await mintTx.wait();
//                     const approveTx = await lpToken.connect(anotherStaker)
//                         .approve(staking.address, ethers.utils.parseEther('1'));
//                     await approveTx.wait();

//                     const stakingWhbarBalanceBefore = await whbar.balanceOf(staking.address);

//                     const {
//                         staker1RewardTx,
//                         staker2RewardTx,
//                         elapsedSecondsSolo,
//                         elapsedSecondsTogether,
//                         elapsedSecondsSolo2,
//                     } = await stakeWithdrawCycleFor2Stakers();

//                     const staker1SharedRate = HBAR_REWARD_RATE.div(3);
//                     const staker2SharedRate = HBAR_REWARD_RATE.sub(staker1SharedRate);
//                     const staker1ExpectedReward = HBAR_REWARD_RATE.mul(elapsedSecondsSolo + elapsedSecondsSolo2)
//                         .add((staker1SharedRate).mul(elapsedSecondsTogether));
//                     const staker2ExpectedReward = staker2SharedRate.mul(elapsedSecondsTogether);

//                     const stakingWhbarBalanceAfter = await whbar.balanceOf(staking.address);
//                     expect(stakingWhbarBalanceBefore.sub(staker1ExpectedReward).sub(staker2ExpectedReward))
//                         .to.equal(stakingWhbarBalanceAfter);
//                     expect(staker1RewardTx.events[1].args.reward).to.equal(staker1ExpectedReward);
//                     expect(staker2RewardTx.events[1].args.reward).to.equal(staker2ExpectedReward);
//                 });

//                 it('should be able to exit', async () => {
//                     const whbarBalanceBefore = await whbar.balanceOf(staking.address);
//                     const stakingTx = await staking.connect(staker).stake(1);
//                     await stakingTx.wait();
//                     const stakingTxBlock = await ethers.provider.getBlock(stakingTx.blockNumber);
//                     const stakingTxTs = stakingTxBlock.timestamp;

//                     const exitTx = await staking.connect(staker).exit();
//                     await exitTx.wait();
//                     const exitTxBlock = await ethers.provider.getBlock(exitTx.blockNumber);
//                     const exitTxTs = exitTxBlock.timestamp;

//                     const balanceOfStaker = await lpToken.balanceOf(staker.address);
//                     expect(balanceOfStaker).to.equal(ethers.utils.parseEther('1'));
//                     expect(await staking.totalSupply()).to.equal(0);
//                     expect(await staking.balanceOf(staker.address)).to.equal(0);
//                     const expectedReward = HBAR_REWARD_RATE.mul(exitTxTs - stakingTxTs);
//                     expect(await whbar.balanceOf(staking.address)).to.equal(whbarBalanceBefore.sub(expectedReward));
//                 });
//             });
//         });
//     });

//     describe('HBAR + HTS Asset campaign', async () => {

//         const REWARD_HTS = ethers.utils.parseUnits('16', 8);
//         const HTS_REWARD_RATE = REWARD_HTS.div(REWARD_DURATION);
//         let htsToken: Contract;

//         beforeEach(async () => {
//             // THIS VALUE IS IN WEIBARS not TINYBARS!!!
//             const depositTx = await whbar.deposit({ value: REWARD_WEIBARS });
//             await depositTx.wait();

//             const approveTx = await whbar.approve(staking.address, REWARD_TINYBARS);
//             await approveTx.wait();

//             const enableHBARTx = await staking.enableReward(whbar.address, false, REWARD_DURATION);
//             await enableHBARTx.wait();

//             const notifyTx = await staking.notifyRewardAmount(whbar.address, REWARD_TINYBARS);
//             await notifyTx.wait();

//             const { address: htsAddress, tokenId } = await HTS.deployMockWithSupply(REWARD_HTS.toNumber());
//             htsToken = new ethers.Contract(htsAddress, IERC20).connect(owner);

//             const enableHTSTx = await staking.enableReward(htsToken.address, true, REWARD_DURATION, { gasLimit: 9_000_000 });
//             await enableHTSTx.wait();

//             const approveHtsTx = await htsToken.approve(staking.address, REWARD_HTS, { gasLimit: 9_000_000 });
//             await approveHtsTx.wait();

//             const notifyHTSTx = await staking.notifyRewardAmount(htsAddress, REWARD_HTS);
//             await notifyHTSTx.wait();
//             // Mint Stakers LP tokens
//             const tx1Mint = await lpToken.mint(staker.address, ethers.utils.parseEther('1'));
//             await tx1Mint.wait();
//             const tx2Mint = await lpToken.mint(anotherStaker.address, ethers.utils.parseEther('1'));
//             await tx2Mint.wait();

//             // Approve Stakers LP tokens
//             const tx1Approve = await lpToken.connect(staker).approve(staking.address, ethers.utils.parseEther('1'));
//             await tx1Approve.wait();

//             const tx2Approve = await lpToken.connect(anotherStaker)
//                 .approve(staking.address, ethers.utils.parseEther('1'));
//             await tx2Approve.wait();

//             // Associate Staker#1 with HTS reward token
//             await HTS.associateWithToken(1, tokenId);

//             // Associate Staker#2 with HTS reward token
//             await HTS.associateWithToken(3, tokenId);
//         });

//         it('should be able to setup HBAR + HTS rewards', async () => {
//             const stakingWhbarBalanceBefore = await whbar.balanceOf(staking.address);
//             const stakingHTSBalanceBefore = await htsToken.balanceOf(staking.address);

//             const {
//                 staker1RewardTx,
//                 staker2RewardTx,
//                 elapsedSecondsSolo,
//                 elapsedSecondsTogether,
//                 elapsedSecondsSolo2,
//             } = await stakeWithdrawCycleFor2Stakers();

//             // Assert HBAR Rewards
//             const staker1SharedHBARRate = HBAR_REWARD_RATE.div(3);
//             const staker2SharedHBARRate = HBAR_REWARD_RATE.sub(staker1SharedHBARRate);
//             const staker1ExpectedHBARReward = HBAR_REWARD_RATE.mul(elapsedSecondsSolo + elapsedSecondsSolo2)
//                 .add((staker1SharedHBARRate).mul(elapsedSecondsTogether));
//             const staker2ExpectedHBARReward = staker2SharedHBARRate.mul(elapsedSecondsTogether);

//             const stakingWhbarBalanceAfter = await whbar.balanceOf(staking.address);
//             const stakingHTSBalanceAfter = await htsToken.balanceOf(staking.address);

//             const staker1HbarRewardEvent = findEvent(staker1RewardTx.events, 'RewardPaid', whbar.address);
//             const staker2HbarRewardEvent = findEvent(staker2RewardTx.events, 'RewardPaid', whbar.address);

//             expect(stakingWhbarBalanceBefore.sub(staker1ExpectedHBARReward).sub(staker2ExpectedHBARReward))
//                 .to.equal(stakingWhbarBalanceAfter);
//             expect(staker1HbarRewardEvent.args.reward).to.equal(staker1ExpectedHBARReward);
//             expect(staker2HbarRewardEvent.args.reward).to.equal(staker2ExpectedHBARReward);

//             // Assert HTS Rewards
//             const staker1SharedHTSRate = HTS_REWARD_RATE.div(3);
//             const staker2SharedHTSRate = HTS_REWARD_RATE.sub(staker1SharedHTSRate);

//             const staker1ExpectedHTSReward = HTS_REWARD_RATE.mul(elapsedSecondsSolo + elapsedSecondsSolo2)
//                 .add((staker1SharedHTSRate).mul(elapsedSecondsTogether));
//             const staker2ExpectedHTSReward = staker2SharedHTSRate.mul(elapsedSecondsTogether);

//             const staker1HTSRewardEvent = findEvent(staker1RewardTx.events, 'RewardPaid', htsToken.address);
//             const staker2HTSRewardEvent = findEvent(staker2RewardTx.events, 'RewardPaid', htsToken.address);

//             expect(stakingHTSBalanceBefore.sub(staker1ExpectedHTSReward).sub(staker2ExpectedHTSReward))
//                 .to.equal(stakingHTSBalanceAfter);
//             expect(staker1HTSRewardEvent.args.reward).to.equal(staker1ExpectedHTSReward);
//             expect(staker2HTSRewardEvent.args.reward).to.equal(staker2ExpectedHTSReward);
//         })
//     })

//     async function stakeWithdrawCycleFor2Stakers () {
//         // 1. Stake 1 WEI from Staker#1
//         const staker1StakeTx = await staking.connect(staker).stake(1);
//         await staker1StakeTx.wait();
//         const staker1StakeTxBlock = await ethers.provider.getBlock(staker1StakeTx.blockNumber);
//         const staker1StakeTxTs = staker1StakeTxBlock.timestamp;

//         await sleep(1_000);

//         // 2. Stake 2 WEI from Staker#2
//         const staker2StakeTx = await staking.connect(anotherStaker).stake(2);
//         await staker2StakeTx.wait();
//         const staker2StakeTxBlock = await ethers.provider.getBlock(staker2StakeTx.blockNumber);
//         const staker2StakeTxTs = staker2StakeTxBlock.timestamp;

//         await sleep(1_000);

//         // 3. Withdraw Reward from Staker#2
//         const withdraw2Tx = await staking.connect(anotherStaker).withdraw(2);
//         await withdraw2Tx.wait();
//         const withdraw2Block = await ethers.provider.getBlock(withdraw2Tx.blockNumber);
//         const withdraw2BlockTs = withdraw2Block.timestamp;

//         // 4. Get Reward from Staker#1
//         const reward1Tx = await staking.connect(staker).getReward();
//         const staker1RewardTx = await reward1Tx.wait();
//         const reward1TxBlock = await ethers.provider.getBlock(reward1Tx.blockNumber);
//         const reward1TxTs = reward1TxBlock.timestamp;

//         // 5. Get Reward from Staker#2
//         const reward2Tx = await staking.connect(anotherStaker).getReward();
//         const staker2RewardTx = await reward2Tx.wait();

//         const elapsedSecondsSolo = staker2StakeTxTs - staker1StakeTxTs;
//         const elapsedSecondsTogether = withdraw2BlockTs - staker2StakeTxTs;
//         const elapsedSecondsSolo2 = reward1TxTs - withdraw2BlockTs;
//         return { staker1RewardTx, staker2RewardTx, elapsedSecondsSolo, elapsedSecondsTogether, elapsedSecondsSolo2 };
//     }
// });

// function sleep (ms: number) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }

// function findEvent (events: any, name: string, rewardToken: string): any {
//     return (events.filter((e: any) => {
//         return e.event == name && e.args.rewardsToken == rewardToken;
//     }))[0];
// }
