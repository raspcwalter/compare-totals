import {
  createThirdwebClient,
  getContract,
} from "thirdweb";
import { sepolia } from "thirdweb/chains";
import {
  ConnectButton,
  useReadContract,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

// import { stringify } from "thirdweb/utils";

import { toTokens, formatNumber } from "thirdweb/utils";

import './App.css'

const client = createThirdwebClient({
  clientId: "c7062f04495772cb44711c8202c022dc", // replace with your actual ID
});

const contract = getContract({
  client,
  address: "0xefc34901fb0ed8f83a92b9a3a16367955f9759a3",
  chain: sepolia,
});

const wallets = [createWallet("io.metamask")];


function App() {
  // Read from the compareTotals function
  const { data, isLoading, error } = useReadContract({
    contract,
    method:
      "function compareTotals() view returns (uint256 sumTotalValor_, uint256 sumFaturadoConvencional_, uint256 sumFaturadoSCEE_)",
    params: [],
  });

  return (
      <div>
        <p>
      This is a MVP for showing the AI agent energy retailing capabilities. 
        </p>
      <ConnectButton
        client={client}
        chain={sepolia}
        wallets={wallets}
        connectModal={{ size: "compact" }}
      />
        <div style={{ marginTop: "2rem" }}>
          {isLoading
            ? "Loading..."
            : error
              ? `Error: ${error.message}`
              : data && (
<div>
                  {data.map((val, i) => {
                    // Convert BigInt value to readable number with 2 decimals
                    const num = parseFloat(
                      toTokens(BigInt(val), 2),
                    );
                    // Format with thousands separator and always 2 decimal digits
                    return (
                      <div key={i}>
                        {num.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    )
                  })}
                </div>                )}
        </div>
    </div>
  );
}

export default App