# 👨‍🌾 HeliSwap Yield Farming Contracts

Node version: `16.15.0`

If you use another version, please use [n](https://github.com/tj/n) to manage.

## ⚙️ Installation

```
yarn
```

## 🚀 Available Scripts

Compile the contracts:

```
npx hardhat compile
```

### ⚙️ Deployment steps:

1. Deploy contract
   Edit `--owner` and `--stakingtoken` in `package.json`

```
yarn deploy
```

2. Add reward

```
yarn addReward
```

3. Approve reward token

```
yarn approveToken
```

4. Send rewards

```
yarn sendReward
```
