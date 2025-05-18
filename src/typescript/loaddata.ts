import "dotenv/config";

import {
  getContract,
  prepareContractCall,
  sendTransaction,
  createThirdwebClient,
} from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { privateKeyToAccount } from "thirdweb/wallets";

const client = createThirdwebClient({
	// use `secretKey` for server side or script usage
	secretKey: process.env.THIRDWEB_SECRET_KEY!,
	});

const privateKey = process.env.WALLET_PRIVATE_KEY!;

const account = privateKeyToAccount({
	  client,
	    privateKey: process.env.WALLET_PRIVATE_KEY!,
});

console.log("Wallet address:", account.address);
// @debug console.log("Private key:", privateKey); // Only for debugging! Remove after use.


const contract = getContract({
  client, // your ThirdwebClient instance
  address: "0x97c4f62fb13bb6e048e661d2d468d0e183911ea7", // be sure it is the right contract 
  chain: sepolia,
});



const records: [
  number,
  number,
  number,
  number,
  number,
  number,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint
][] = [
 [2024, 6, 187, 154, 13, 20, 12057n, 1312n, 3010n, 16379n, 901412n, 887424n],
 [2024, 7, 168, 140, 11, 17, 10898n, 1103n, 2540n, 14541n, 901412n, 887424n],
 [2024, 8, 192, 160, 13, 19, 12628n, 1315n, 2847n, 16790n, 901412n, 887424n],
 [2024, 9, 200, 167, 12, 21, 13242n, 1223n, 3179n, 17644n, 901412n, 887424n],
 [2024, 10, 145, 119, 10, 16, 10243n, 1093n, 2561n, 13897n, 893351n, 876874n],
 [2024, 11, 179, 145, 13, 21, 12395n, 1406n, 3322n, 17123n, 874541n, 852259n],
 [2024, 12, 208, 171, 15, 22, 14417n, 1633n, 3603n, 19653n, 874541n, 852259n],
 [2025, 1, 103, 87, 6, 10, 6471n, 579n, 1462n, 8512n, 874541n, 852259n],
 [2025, 2, 193, 163, 11, 19, 12373n, 1084n, 2833n, 16290n, 874541n, 852259n],
 [2025, 3, 151, 125, 10, 16, 9468n, 983n, 2381n, 12832n, 874541n, 852259n],
 [2025, 4, 113, 94, 8, 11, 7000n, 773n, 1608n, 9381n, 874541n, 852259n],
 [2025, 5, 174, 149, 9, 16, 11320n, 886n, 2382n, 14588n, 874541n, 852259n],
];

async function uploadAllRecords(account: any) {
  for (const [i, params] of records.entries()) {
    console.log("for loop i:", i);
    try {

      const tx = prepareContractCall({
        contract,
        method: `function addRecord(uint16,uint8,uint16,uint16,uint16,uint16,uint256,uint256,uint256,uint256, uint256, uint256)`,
        params,
      });

      console.log("Account:", account);
      console.log("Prepared transaction:", tx); // or whatever variable you use for the transaction

      const { transactionHash } = await sendTransaction({
        transaction: tx,
        account,
      });
      console.log(
        `Row ${i + 1}: Success. Tx: ${transactionHash}`,
      );
    } catch (err) {
      console.error(
        `Row ${i + 1}: Failed to upload. Error:`,
        err,
      );
      // Optional: Decide whether to break, skip, or retry depending on err type      
    }
    
    await new Promise(r => setTimeout(r, 30000));

  }
}

(async () => {
    await uploadAllRecords(account).catch(console.error);
})(); 