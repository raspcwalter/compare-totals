// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnergyMonthlyRecord {
    struct MonthData {
        uint16 year;
        uint8 month; // 1 to 12
        uint16 totalKWh;
        uint16 foraDePontaKWh;
        uint16 intermediarioKWh;
        uint16 pontaKWh;
        uint256 foraDePontaValor;
        uint256 intermediarioValor;
        uint256 pontaValor;
        uint256 totalValor;
        uint256 tarifaConvencional; // R$ / kWh
        uint256 tarifaSCEE; // R$ / kWh 
    }

    MonthData[] public records;
    mapping(uint16 => mapping(uint8 => uint256)) public recordIndex; // year => month => position (index+1)

    event RecordAdded(uint16 year, uint8 month, uint256 index);

    function addRecord(
        uint16 year,
        uint8 month,
        uint16 totalKWh,
        uint16 foraDePontaKWh,
        uint16 intermediarioKWh,
        uint16 pontaKWh,
        uint256 foraDePontaValor,
        uint256 intermediarioValor,
        uint256 pontaValor,
        uint256 totalValor,
        uint256 tarifaConvencional,
        uint256 tarifaSCEE
    ) external {
        records.push(MonthData(
            year,
            month,
            totalKWh,
            foraDePontaKWh,
            intermediarioKWh,
            pontaKWh,
            foraDePontaValor,
            intermediarioValor,
            pontaValor,
            totalValor,
            tarifaConvencional,
            tarifaSCEE
        ));
        uint256 idx = records.length - 1;
        recordIndex[year][month] = idx + 1; // So default 0 means none
        emit RecordAdded(year, month, idx);
    }

    function getRecord(uint16 year, uint8 month) external view returns (MonthData memory) {
        uint256 idx = recordIndex[year][month];
        require(idx > 0, "No data for this month/year");
        return records[idx - 1];
    }

    function allRecords() external view returns (MonthData[] memory) {
        return records;
    }

    function averageTariff() external view returns (uint256) {
        uint256 totalKWh = 0;
        uint256 totalValor = 0;
        for (uint256 i = 0; i < records.length; i++) {
            totalKWh += records[i].totalKWh;
            totalValor += records[i].totalValor;
        }
        require(totalKWh > 0, "No kWh data");
        // result in R$ per kWh, scaled by 1e4 for precision
        return (totalValor * 1e4) / totalKWh;
    }

    function averageTariff(uint16 year, uint8 month) external view returns (uint256) {
        uint256 idx = recordIndex[year][month];
        require(idx > 0, "No data for this month/year");
        MonthData memory rec = records[idx - 1];
        require(rec.totalKWh > 0, "No kWh data");
        // Result is scaled by 1e6 for decimal precision
        return (rec.totalValor * 1e6) / rec.totalKWh;
    }

    function valorFaturadoConvencional(uint16 year, uint8 month) internal view returns (uint256) {
        uint256 idx = recordIndex[year][month];
        require(idx > 0, "No data for this month/year");
        MonthData memory rec = records[idx - 1];
        // result scaled by 1e4 for decimals
        uint256 result = (uint256(rec.totalKWh) * rec.tarifaConvencional) / 1e4;
        return result;
    }

    function valorFaturadoSCEE(uint16 year, uint8 month) internal view returns (uint256) {
        uint256 idx = recordIndex[year][month];
        require(idx > 0, "No data for this month/year");
        MonthData memory rec = records[idx - 1];
        // result scaled by 1e4 for decimals
        uint256 result = (uint256(rec.totalKWh) * rec.tarifaSCEE) / 1e4;
        return result;
    }

    function compareTotals() external view returns (
        uint256 sumTotalValor_,
        uint256 sumFaturadoConvencional_,
        uint256 sumFaturadoSCEE_
    ) {
        uint256 sumTotalValor = 0;
        uint256 sumFaturadoConvencional = 0;
        uint256 sumFaturadoSCEE = 0;

        for (uint256 i = 0; i < records.length; i++) {
            // Assume convencionalTariff and sceeTariff scaled by 1e6 for decimals
            sumTotalValor += records[i].totalValor;
            sumFaturadoConvencional += valorFaturadoConvencional(records[i].year, records[i].month);
            sumFaturadoSCEE += valorFaturadoSCEE(records[i].year, records[i].month);
        }
        return (sumTotalValor, sumFaturadoConvencional, sumFaturadoSCEE);
    }

}