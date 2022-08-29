import {expect} from "chai";
import { ContractFunction } from '@ethersproject/contracts';

export namespace Utils {

	export async function expectRevert(tx: ContractFunction | any) {
		let found = false;
        try {
			await tx.wait();
		} catch (e: any) {
            found = true;
			expect(e.code).to.be.oneOf(["CONTRACT_REVERT_EXECUTED", "CALL_EXCEPTION"]);
		}
        expect(found).to.be.true
	}
}
