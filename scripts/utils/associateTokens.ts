import { HTS } from '../../utils/HTS';

async function associateHTS(accountid: string, pk: string, tokenid: string) {
  await HTS.associate(pk, accountid, tokenid);

  console.log(`HTS Token ${tokenid} Associated to : ${accountid}`);
}

module.exports = associateHTS;
