import "dotenv/config";
import {
  createThirdwebClient,
  prepareTransaction,
  sendTransaction,
} from "thirdweb";
import { generateAccount } from "thirdweb/wallets";
import { sepolia } from "thirdweb/chains";

async function main() {
  try {
    // Check for required environment variables
    const secretKey = process.env.THIRDWEB_SECRET_KEY;
    if (!secretKey) {
      throw new Error("THIRDWEB_SECRET_KEY is missing in environment variables");
    }

    // Initialize Thirdweb client
    const client = createThirdwebClient({ secretKey });
    
    // Generate an account
    const account = await generateAccount({ client });
    console.log("Generated account address:", account.address);
    
    // Make request to Nebula API
    console.log("Sending request to Nebula API...");
    const response = await fetch("https://nebula-api.thirdweb.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": secretKey,
      },
      body: JSON.stringify({
        message: "send 0.001 ETH to 0xC08857A0D0811Fc5BeDdD42931c3E5e5a6711523 on sepolia",
        execute_config: {
          mode: "client",
          signer_wallet_address: account.address, // Use the generated account address for consistency
        },
      }),
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Nebula API response:", JSON.stringify(data, null, 2));

    // Process the response
    if (data.actions && data.actions.length > 0) {
      const action = data.actions[0];
      console.log("Processing action:", action.type);
      
      if (action.data) {
        const txData = JSON.parse(action.data);
        console.log("Transaction data:", txData);

        // Prepare the transaction
        const transaction = prepareTransaction({
          to: txData.to,
          data: txData.data,
          value: BigInt(txData.value),
          chain: sepolia, // Use the imported sepolia chain
          client,
        });

        // Send the transaction
        console.log("Sending transaction...");
        const result = await sendTransaction({
          transaction,
          account,
        });

        console.log("Transaction successful!");
        console.log("Transaction hash:", result.transactionHash);
        return result;
      } else {
        console.log("No transaction data found in the action");
      }
    } else {
      console.log("No actions found in the response");
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  }
}

main();