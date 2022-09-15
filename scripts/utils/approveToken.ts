import { HTS } from '../../utils/HTS';

async function approveToken(
  accountid: string,
  pk: string,
  spenderAccountId: string,
  tokenid: string,
  amount: number,
) {
  await HTS.approve(pk, accountid, spenderAccountId, tokenid, amount);
  console.log(
    `${accountid} approved ${amount} of HTS Token ${tokenid} to be spent by ${spenderAccountId}`,
  );
}

module.exports = approveToken;
