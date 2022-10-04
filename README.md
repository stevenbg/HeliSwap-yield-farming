# 👨‍🌾 HeliSwap Yield Farming Contracts

Node version: `16.15.0`

If you use another version, please use [n](https://github.com/tj/n) to manage.

## ✍️ Mainnet Deployment Address

`Factory: 0x0000000000000000000000000000000000134238`

[See on Hashscan](https://hashscan.io/#/mainnet/contract/0.0.1262136)

## ⚙️ Installation

```
yarn
```

Copy config file and add you id and private key:

```bash
cp example.config.ts config.ts
```

## 🚀 Available Scripts

Compile the contracts:

```
npx hardhat compile
```

### ⚙️ Deployment steps:

Arguments for deployment scripts

```
--owner               -> Deployer address
--token               -> Staking LP token address
--campaign            -> Deployed campaign address
--reward              -> Reward token address
--duration            -> Reward duration in seconds
--amount              -> Reward amount
--spenderaccountid    -> Deployed campaign id
```

1. Deploy Factory

```
yarn deployFactory
```

2. Deploy Campaign

Edit `--factory`, `--owner` and `--token` in `package.json`

```
yarn deployCampaign
```

3. Enable Reward

Edit `--campaign`, `--reward`, `--duration` in `package.json`

```
yarn enableReward
```

4. Approve reward token

Edit `--spenderaccountid` and `--tokenid` in `package.json`

```
yarn approveToken
```

5. Send rewards

Edit `--campaign`, `--reward` and `--amount` in `package.json`

```
yarn sendReward
```

## Running Tests

In order for you to run tests, you must uncomment the line in `hardhat.config.ts`:

```typescript
// require('@hashgraph/hardhat-hethers'); // UNCOMMENT WHEN EXECUTING SCRIPTS; COMMENT WHEN RUNNING TESTS
```

and you must run the `hedera-local-node` prior to running the tests.
Once you have both prerequisites done, you need to run:

```
npx hardhat test
```
