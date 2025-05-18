import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const contract = await ethers.getContractAt(
    "EnergyMonthlyRecord", // Contract name
    "0xEFC34901Fb0Ed8f83A92b9a3a16367955F9759A3",
  );
  // This function returns three uint256 values as BigNumber (ethers.js)
  const [
    sumTotalValor,
    sumFaturadoConvencional,
    sumFaturadoSCEE,
  ]: [
    ethers.BigNumber,
    ethers.BigNumber,
    ethers.BigNumber,
  ] = await contract.compareTotals();
  console.log({
    sumTotalValor: sumTotalValor.toString(),
    sumFaturadoConvencional:
      sumFaturadoConvencional.toString(),
    sumFaturadoSCEE: sumFaturadoSCEE.toString(),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

