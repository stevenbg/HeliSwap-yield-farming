import { ethers } from 'hardhat';
import { expect } from 'chai';
import { smock } from "@defi-wonderland/smock";

describe('Factory', () => {

    const WHBAR = '0x0000000000000000000000000000000000000001';
    const FEE = ethers.utils.parseEther("1");
    const FEE_ASSET = '0x0000000000000000000000000000000000000002';
    const POOLS_FACTORY = '0x0000000000000000000000000000000000000003';

    let signers: any;
    let factory: any;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const Factory = await ethers.getContractFactory('Factory');
        factory = await (await Factory.deploy(WHBAR, FEE, FEE_ASSET, POOLS_FACTORY)).deployed();
    });

    it('Should deploy correctly ', async () => {
        expect(await factory.WHBAR()).to.equal(WHBAR);
        expect(await factory.fee()).to.equal(FEE);
        expect(await factory.feeAsset()).to.equal(FEE_ASSET);
        expect(await factory.poolsFactory()).to.equal(POOLS_FACTORY);
    });

    describe('Set Fee', function () {
        it('Should set fee', async function () {
            await factory.setFee(ethers.constants.AddressZero, ethers.constants.AddressZero);
            expect(await factory.fee()).to.equal(ethers.constants.AddressZero);
            expect(await factory.feeAsset()).to.equal(ethers.constants.AddressZero);

            const feeDetails = await factory.getFeeDetails();
            expect(feeDetails[0]).to.equal(ethers.constants.AddressZero);
            expect(feeDetails[1]).to.equal(ethers.constants.AddressZero);
        });

        it('Should revert when not the owner tries to set the fee', async function () {
            await expect(
                factory.connect(signers[1]).setFee(ethers.constants.AddressZero, ethers.constants.AddressZero)
            ).to.be.revertedWith("Only the contract owner may perform this action");
        });
    });

    describe('Set Reward Tokens', function () {
        it('Should set reward tokens', async function () {
            await factory.setRewardTokens([
                "0x0000000000000000000000000000000000000004",
                "0x0000000000000000000000000000000000000005",
                "0x0000000000000000000000000000000000000006"
            ], true);
            expect(await factory.rewardTokens("0x0000000000000000000000000000000000000004")).to.equal(true);
            expect(await factory.rewardTokens("0x0000000000000000000000000000000000000005")).to.equal(true);
            expect(await factory.rewardTokens("0x0000000000000000000000000000000000000006")).to.equal(true);

            await factory.setRewardTokens([
                "0x0000000000000000000000000000000000000004",
                "0x0000000000000000000000000000000000000005",
                "0x0000000000000000000000000000000000000006"
            ], false);
            expect(await factory.rewardTokens("0x0000000000000000000000000000000000000004")).to.equal(false);
            expect(await factory.rewardTokens("0x0000000000000000000000000000000000000005")).to.equal(false);
            expect(await factory.rewardTokens("0x0000000000000000000000000000000000000006")).to.equal(false);

        });

        it('Should revert when not the owner tries to set the reward tokens', async function () {
            await expect(
                factory.connect(signers[1]).setRewardTokens([
                    "0x0000000000000000000000000000000000000004",
                    "0x0000000000000000000000000000000000000005",
                    "0x0000000000000000000000000000000000000006"
                ], true)
            ).to.be.revertedWith("Only the contract owner may perform this action");
        });
    });

    describe('Withdraw Fee', function () {
        it('Should withdraw accumulated fee so far', async function () {
            const tokenFactory = await ethers.getContractFactory("MockLPToken");
            const token = await (await tokenFactory.deploy()).deployed();

            const Factory = await ethers.getContractFactory('Factory');
            const factoryWithAsset = await (await Factory.deploy(WHBAR, FEE, token.address, POOLS_FACTORY)).deployed();

            await token.mint(factoryWithAsset.address, ethers.utils.parseEther("1"));
            expect(await token.balanceOf(factoryWithAsset.address)).to.be.equal(ethers.utils.parseEther("1"));

            await factoryWithAsset.withdrawFee(signers[3].address);

            expect(await token.balanceOf(factoryWithAsset.address)).to.be.equal(0);
            expect(await token.balanceOf(signers[3].address)).to.be.equal(ethers.utils.parseEther("1"));
        });

        it('Should revert when not the owner tries to withdraw the fee', async function () {
            await expect(
                factory.connect(signers[1]).withdrawFee(signers[3].address)
            ).to.be.revertedWith("Only the contract owner may perform this action");
        });
    });

    describe('Deploy a campaign', function () {
        it('Should deploy a campaign', async function () {
            const tokenFactory = await ethers.getContractFactory("MockLPToken");
            const tokenA = await (await tokenFactory.deploy()).deployed();
            const tokenB = await (await tokenFactory.deploy()).deployed();

            const poolsFactory = await smock.fake([
                {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "name": "getPair",
                    "outputs": [
                        {
                            "internalType": "address",
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
            ]);

            const POOL = "0x0000000000000000000000000000000000000021";
            // @ts-ignore
            poolsFactory.getPair.returns(POOL);

            const Factory = await ethers.getContractFactory('Factory');
            const factoryWithPool = await (await Factory.deploy(WHBAR, FEE, FEE_ASSET, poolsFactory.address)).deployed();

            await factoryWithPool.deploy(tokenA.address, tokenB.address);

            expect(await factoryWithPool.campaigns(0)).to.be.not.equal(ethers.constants.AddressZero);
            expect(await factoryWithPool.farmCampaigns(POOL)).to.be.not.equal(ethers.constants.AddressZero);
        });

        it('Should revert when pool does not exists', async function () {
            const tokenFactory = await ethers.getContractFactory("MockLPToken");
            const tokenA = await (await tokenFactory.deploy()).deployed();
            const tokenB = await (await tokenFactory.deploy()).deployed();

            const poolsFactory = await smock.fake([
                {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "name": "getPair",
                    "outputs": [
                        {
                            "internalType": "address",
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
            ]);

            const POOL = ethers.constants.AddressZero;
            // @ts-ignore
            poolsFactory.getPair.returns(POOL);


            const Factory = await ethers.getContractFactory('Factory');
            const factoryWithPool = await (await Factory.deploy(WHBAR, FEE, FEE_ASSET, poolsFactory.address)).deployed();

            await expect(
                factoryWithPool.deploy(tokenA.address, tokenB.address)
            ).to.be.revertedWith("Such a pool does not exists");
        });

        it('Should revert when pool already has been added', async function () {
            const tokenFactory = await ethers.getContractFactory("MockLPToken");
            const tokenA = await (await tokenFactory.deploy()).deployed();
            const tokenB = await (await tokenFactory.deploy()).deployed();

            const poolsFactory = await smock.fake([
                {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "name": "getPair",
                    "outputs": [
                        {
                            "internalType": "address",
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
            ]);

            const POOL = "0x0000000000000000000000000000000000000021";
            // @ts-ignore
            poolsFactory.getPair.returns(POOL);

            const Factory = await ethers.getContractFactory('Factory');
            const factoryWithPool = await (await Factory.deploy(WHBAR, FEE, FEE_ASSET, poolsFactory.address)).deployed();

            await factoryWithPool.deploy(tokenA.address, tokenB.address);

            await expect(
                factoryWithPool.deploy(tokenA.address, tokenB.address)
            ).to.be.revertedWith("Campaign already exists for the given pool");
        });
    });
});
