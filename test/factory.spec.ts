import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Utils } from '../utils/utils';
import expectRevert = Utils.expectRevert;

describe('Factory', () => {

    const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';
    let factory: Contract;
    let owner: SignerWithAddress;
    let newOwner: SignerWithAddress;
    let otherUser: SignerWithAddress;

    beforeEach(async () => {
        const signers = await ethers.getSigners();
        owner = signers[0];
        newOwner = signers[1];
        otherUser = signers[2];

        const Factory = await ethers.getContractFactory('Factory');
        let factoryDeployment = await Factory.deploy(ADDRESS_ONE);
        const { contractAddress } = await factoryDeployment.deployTransaction.wait();
        factory = await ethers.getContractAt('Factory', contractAddress);
    });

    it('should set WHBAR address', async () => {
        expect(await factory.WHBAR()).to.equal(ADDRESS_ONE);
    });

    it('should set the owner', async () => {
        expect(await factory.owner()).to.equal(owner.address);
    });

    it('should transfer ownership to new owner', async () => {
        await expect(factory.nominateNewOwner(newOwner.address))
            .to.emit(factory, "OwnerNominated")
            .withArgs(newOwner.address);

        await expect(factory.connect(newOwner).acceptOwnership())
            .to.emit(factory, "OwnerChanged")
            .withArgs(owner.address, newOwner.address);

        expect(await factory.owner()).to.equal(newOwner.address);
        expect(await factory.nominatedOwner()).to.equal(ethers.constants.AddressZero);
    });

    it('should revert when non-owner nominates new owner', async () => {
        await expectRevert(await factory.connect(otherUser).nominateNewOwner(owner.address))
    })

    it('should revert when non-nominated tries to accept ownership', async () => {
        await factory.nominateNewOwner(newOwner.address);
        await expectRevert(await factory.connect(otherUser).acceptOwnership());
    })

    it('should revert when non-owner deploys', async () => {
        await expectRevert(await factory.connect(otherUser).deploy(owner.address, ADDRESS_ONE));
    })

    it('should deploy campaign', async () => {
        await expect(factory.deploy(owner.address, ADDRESS_ONE))
            .to.emit(factory, "CampaignDeployed");
        expect(await factory.getCampaignsLength()).to.equal(1);

        const campaignAddr = await factory.campaigns(0);
        expect(campaignAddr).to.not.equal(ethers.constants.AddressZero);
        const campaign = await ethers.getContractAt('MultiRewards', campaignAddr);

        expect(await campaign.stakingToken()).to.equal(ADDRESS_ONE);
    })
});
