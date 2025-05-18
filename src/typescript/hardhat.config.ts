import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true, 
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.RPC_NODE_S,
      chainId: Number(process.env.CHAIN_ID_S),
      accounts: {
        mnemonic: process.env.SECRET
      }
    },
    holesky: {
      url: process.env.RPC_NODE_H,
      chainId: Number(process.env.CHAIN_ID_H),
      accounts: {
        mnemonic: process.env.SECRET
      }
    }
  },
  etherscan: {
    apiKey: process.env.API_KEY
  },
  sourcify: {
    enabled:true
  }
};

export default config;