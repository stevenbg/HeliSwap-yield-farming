import { expect } from 'chai';
import { ethers } from 'hardhat';
import { smock } from '@defi-wonderland/smock';

describe('Whitelisted Tokens', () => {

    const WHBAR = '0x0000000000000000000000000000000000000001';

    let signers: any;
    let whitelist: any;
    let poolsFactory: any;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        poolsFactory = await smock.fake('IPoolsFactory');

        const Whitelist = await ethers.getContractFactory('Whitelist');
        whitelist = await (await Whitelist.deploy(WHBAR, poolsFactory.address)).deployed();
    });

    it('Should deploy correctly ', async () => {
        expect(await whitelist.whbar()).to.equal(WHBAR);
        expect(await whitelist.poolsFactory()).to.equal(poolsFactory.address);
    });

    describe('Set Whitelist', function () {
        const TOKEN_A = '0x0000000000000000000000000000000000000002';
        const TOKEN_B = '0x0000000000000000000000000000000000000003';
        const TOKEN_C = '0x0000000000000000000000000000000000000004';

        beforeEach(async () => {
            poolsFactory.getPair.whenCalledWith(TOKEN_A, WHBAR).returns(TOKEN_A);
            poolsFactory.getPair.whenCalledWith(TOKEN_B, WHBAR).returns(TOKEN_B);
            poolsFactory.getPair.whenCalledWith(TOKEN_C, WHBAR).returns(ethers.constants.AddressZero);
        });

        it('Should set whitelisted tokens', async function () {
            await whitelist.setWhitelist([TOKEN_A, TOKEN_B], true);

            expect(await whitelist.whitelistedTokens(TOKEN_A)).to.be.equal(true);
            expect(await whitelist.whitelistedTokens(TOKEN_B)).to.be.equal(true);

            await whitelist.setWhitelist([TOKEN_A, TOKEN_B], false);
            expect(await whitelist.whitelistedTokens(TOKEN_A)).to.be.equal(false);
            expect(await whitelist.whitelistedTokens(TOKEN_B)).to.be.equal(false);
        });

        it('Should revert when there is no a direct pool for a given token with WHBAR', async function () {
            await expect(
                whitelist.setWhitelist([TOKEN_A, TOKEN_B, TOKEN_C], true)
            ).to.be.revertedWith('There is no a pool with Token:WHBAR');

            await expect(
                whitelist.setWhitelist([TOKEN_A, TOKEN_C, TOKEN_B], true)
            ).to.be.revertedWith('There is no a pool with Token:WHBAR');

            await expect(
                whitelist.setWhitelist([TOKEN_C], true)
            ).to.be.revertedWith('There is no a pool with Token:WHBAR');

            await expect(
                whitelist.setWhitelist([TOKEN_C], false)
            ).to.be.revertedWith('There is no a pool with Token:WHBAR');
        });

        it('Should revert when not the owner tries to set the fee', async function () {
            await expect(
                whitelist.connect(signers[1]).setWhitelist([TOKEN_A], true)
            ).to.be.revertedWith('Ownable: caller is not the owner');
        });
    });
});
