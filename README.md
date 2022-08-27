# 👨‍🌾 HeliSwap Yield Farming Contracts

Node version: `16.15.0`

If you use another version, please use [n](https://github.com/tj/n) to manage.

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
--stakingtoken        -> Staking LP token address
--contractaddress     -> Deployed campaign address
--rewardaddress       -> Reward token address
--rewarddistributor   -> Same as deployed address
--rewardduration      -> Reward duration in seconds
--rewardamount        -> Reward amount
--rewarddecimals      -> Reward decimals
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
