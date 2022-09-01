import hardhat from 'hardhat';
import NodeClient from '@hashgraph/sdk/lib/client/NodeClient';
import { Client, PrivateKey, TokenCreateTransaction, TransactionId } from '@hashgraph/sdk';
const config = require('../hardhat.config');

export namespace HTS {

    const DEFAULT_ACCOUNT = '0.0.0';
    const DEPLOYER_ACC_ID = '0.0.1012'; // Hardcoded -> first ECDSA alias account from local node

    export async function deployMockWithSupply(supply: number) {
        const deployerPk = config.networks[hardhat.network.name].accounts[0];
        const client = _clientFor(hardhat.network.name, deployerPk);

        const tokenCreate = await (await new TokenCreateTransaction()
            .setTokenName("MockHTS")
            .setTokenSymbol("MHTS")
            .setExpirationTime(_getExpiration())
            .setDecimals(8)
            .setInitialSupply(supply)
            .setTreasuryAccountId(client.operatorAccountId || DEFAULT_ACCOUNT)
            .setTransactionId(TransactionId.generate(client.operatorAccountId || DEFAULT_ACCOUNT))
            .setNodeAccountIds([client._network.getNodeAccountIdsForExecute()[0]])
            .freeze()
            .sign(PrivateKey.fromStringECDSA(deployerPk)))
            .execute(client)

        const receipt = await tokenCreate.getReceipt(client);
        return `0x${receipt.tokenId?.toSolidityAddress()}`;
    }

    /**
     * Returns Client for the specified network name
     * @param network
     * @param pk
     */
    export function _clientFor(network: string, pk: string): NodeClient {
        let client;
        if (network == "previewnet") client = Client.forPreviewnet();
        if (network == "testnet") client = Client.forTestnet();
        if (network == "mainnet") client = Client.forMainnet();
        if (network == "local") client = Client.forNetwork({"127.0.0.1:50211": "0.0.3"})

        if (client) return client.setOperator(DEPLOYER_ACC_ID, pk);
        throw Error("INVALID_NETWORK")
    }

    function _getExpiration(): Date {
        const exp = new Date();
        exp.setDate(exp.getDate() + 30);
        return exp;
    }
}
