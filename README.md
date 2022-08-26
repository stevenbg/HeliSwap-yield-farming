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

1. Deploy factory

```
yarn deployFactory
```

2. Deploy contract

Edit `--factoryaddress`, `--owner` and `--stakingtoken` in `package.json`

```
yarn deployMultirewards
```

3. Add reward

Edit `--contractaddress`, `--rewardaddress`, `--rewarddistributor` and `--rewardduration` in `package.json`

```
yarn addReward
```

4. Approve reward token

Edit `--spenderaccountid` and `--tokenid` in `package.json`

```
yarn approveToken
```

5. Send rewards

Edit `--contractaddress`, `--rewardaddress`, `--rewardamount` and `--rewarddecimals` in `package.json`

```
yarn sendReward
```
