"use client"

import { useState } from "react"
// import { sepolia } from "thirdweb/chains";

import { useReadContract } from "thirdweb/react"

import { contract } from "../App.jsx"

// Contract address on Sepolia
const CONTRACT_ADDRESS = "0x97c4f62fb13bb6e048e661d2d468d0e183911ea7"

function EnergyConsumptionAnalyzer() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])
  const [accountAddress, setAccountAddress] = useState("")
  //  const [client, setClient] = useState(null)
  const [secretKey, setSecretKey] = useState(null)
  const [energyRecords, setEnergyRecords] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [fetchMethod, setFetchMethod] = useState("allRecords") // "allRecords" or "getRecord"
  const [useSampleData, setUseSampleData] = useState(false)

  // Add this after your useState declarations
  const {
    data: contractData,
    isLoading: contractLoading,
    error: contractError,
  } = useReadContract({
    contract,
    method:
      "function allRecords() view returns (tuple(uint16, uint8, uint16, uint16, uint16, uint16, uint256, uint256, uint256, uint256, uint256, uint256)[])",
    params: [],
  })

  /*   // Initialize client and account on component mount
  useEffect(() => {
    initializeClient()
  }, [])
 */
  const addLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, { time: new Date().toLocaleTimeString(), message }])
  }

  const clearLogs = () => {
    setLogs([])
  }

  /* 
  const initializeClient = async () => {
    try {
      // Check for required environment variables
      const key = import.meta.env.VITE_THIRDWEB_SECRET_KEY
      if (!key) {
        throw new Error("VITE_THIRDWEB_SECRET_KEY is missing in environment variables")
      }

      // Initialize Thirdweb client
      addLog("Initializing Thirdweb client...")
      const thirdwebClient = createThirdwebClient({ secretKey: key })

      // Generate an account
      addLog("Generating account...")
      const account = await generateAccount({ client: thirdwebClient })
      setAccountAddress(account.address)
      addLog(`Generated account address: ${account.address}`)

      // Store client and key
      setClient(thirdwebClient)
      setSecretKey(key)

      return { client: thirdwebClient, account, secretKey: key }
    } catch (error) {
      setError(error.message)
      addLog(`Error initializing client: ${error.message}`)
      return null
    }
  } */

  const fetchEnergyRecords = async () => {
    setLoading(true)
    setError(null)
    clearLogs()
    setEnergyRecords([])

    try {
      // Call the contract to get energy records
      if (fetchMethod === "allRecords") {
        addLog("Using contract data from hook...")

        if (contractLoading) {
          addLog("Contract data is still loading...")
          // You can choose to wait or use sample data while loading
        } else if (contractError) {
          throw new Error(`Contract read error: ${contractError.message}`)
        } else if (contractData) {
          // Process the contract data here
          addLog("Contract data received successfully")

          // Transform the contract data to match your energyRecords format
          try {
            const transformedData = contractData.map((record, index) => {
              // Assuming the contract returns data in a specific format
              // You'll need to adjust this based on your actual contract return structure
              return {
                id: index + 1,
                year: record[0] || 0, // Adjust these indices based on your contract's return structure
                month: record[1] || 0,
                monthName: getMonthName(record[1] || 0),
                foraDePontaKWh: Number(record[6] || 0),
                intermediarioKWh: Number(record[7] || 0),
                pontaKWh: Number(record[8] || 0),
              }
            })

            setEnergyRecords(transformedData)
            addLog(`Successfully processed ${transformedData.length} records from contract`)
            setUseSampleData(false)
          } catch (error) {
            addLog(`Error transforming contract data: ${error.message}`)
            // Fall back to sample data
            const sampleData = getSampleEnergyData()
            setEnergyRecords(sampleData)
            setUseSampleData(true)
            addLog("Falling back to sample data due to transformation error")
          }
        } else {
          addLog("No contract data available yet, using sample data")
          // Fall back to sample data
          const sampleData = getSampleEnergyData()
          setEnergyRecords(sampleData)
          setUseSampleData(true)
          addLog(`Using sample data (${sampleData.length} records)`)
        }
      } else {
        await fetchSingleRecord({ secretKey }, year, month)
      }
    } catch (error) {
      setError(error.message)
      addLog(`Error: ${error.message}`)
      if (error.cause) {
        addLog(`Cause: ${error.cause}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchSingleRecord = async (clientData, year, month) => {
    addLog(`Fetching energy consumption record for ${year}/${month} from contract...`)

    try {
      // Try direct message approach
      const response = await fetch("https://nebula-api.thirdweb.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-secret-key": clientData.secretKey,
        },
        body: JSON.stringify({
          message: `Call the getRecord(${year}, ${month}) function on the smart contract at address ${CONTRACT_ADDRESS} on the Sepolia network. This function returns the energy consumption record for the specified year and month. Please return the raw data.`,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed with status ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      addLog("Nebula API response received")

      // Check if we got a response with useful data
      if (data.response) {
        addLog("Processing response data...")

        // Try to extract contract data from the response
        const record = extractSingleRecordFromResponse(data.response, year, month)

        if (record) {
          setEnergyRecords([record])
          addLog(`Successfully extracted record for ${year}/${month}`)
          setUseSampleData(false)
          return
        } else {
          addLog(`Could not extract valid record for ${year}/${month} from response`)
        }
      }

      // If we reach here, we couldn't get data from the response
      addLog("Falling back to sample data for the specified month")
      const sampleRecord = getSampleRecordForMonth(month)
      setEnergyRecords([sampleRecord])
      setUseSampleData(true)
      addLog(`Using sample data for ${getMonthName(month)}`)
    } catch (error) {
      addLog(`Error fetching record for ${year}/${month}: ${error.message}`)

      // Fallback to sample data
      addLog("Falling back to sample data due to error")
      const sampleRecord = getSampleRecordForMonth(month)
      setEnergyRecords([sampleRecord])
      setUseSampleData(true)
      addLog(`Using sample data for ${getMonthName(month)}`)
    }
  }

  // Extract contract data from Nebula API response
  const extractContractDataFromResponse = (response) => {
    try {
      // Log the response for debugging
      console.log("Raw Nebula response:", response)

      // Try to find JSON data in the response
      const jsonMatches =
        response.match(/```json\s*([\s\S]*?)\s*```/) ||
        response.match(/```\s*([\s\S]*?)\s*```/) ||
        response.match(/\[\s*\{[\s\S]*?\}\s*\]/) ||
        response.match(/\{\s*"[\w]+"[\s\S]*?\}/)

      if (jsonMatches) {
        let jsonStr = jsonMatches[0]
        // Clean up the string if it's wrapped in code blocks
        jsonStr = jsonStr.replace(/```json|```/g, "").trim()

        const jsonData = JSON.parse(jsonStr)

        // If it's an array of records
        if (Array.isArray(jsonData)) {
          return jsonData.map((record, index) => ({
            id: index + 1,
            year: Number(record.year || 0),
            month: Number(record.month || 0),
            monthName: getMonthName(Number(record.month || 0)),
            foraDePontaKWh: Number(record.foraDePontaKWh || 0),
            intermediarioKWh: Number(record.intermediarioKWh || 0),
            pontaKWh: Number(record.pontaKWh || 0),
          }))
        }

        // If it's a single record object
        if (jsonData && typeof jsonData === "object" && !Array.isArray(jsonData)) {
          return [
            {
              id: 1,
              year: Number(jsonData.year || 0),
              month: Number(jsonData.month || 0),
              monthName: getMonthName(Number(jsonData.month || 0)),
              foraDePontaKWh: Number(jsonData.foraDePontaKWh || 0),
              intermediarioKWh: Number(jsonData.intermediarioKWh || 0),
              pontaKWh: Number(jsonData.pontaKWh || 0),
            },
          ]
        }
      }

      // Try to extract data from text description
      if (
        response.includes("foraDePontaKWh") &&
        response.includes("intermediarioKWh") &&
        response.includes("pontaKWh")
      ) {
        // This is a very basic extraction - would need to be improved for production
        const records = []
        const lines = response.split("\n")

        let currentRecord = {}
        let recordCount = 0

        for (const line of lines) {
          if (line.includes("year:") || line.includes("year =")) {
            // Start of a new record
            if (Object.keys(currentRecord).length > 0) {
              records.push({
                id: recordCount,
                ...currentRecord,
                monthName: getMonthName(currentRecord.month || 0),
              })
              currentRecord = {}
            }
            recordCount++
            currentRecord.year = extractNumberFromLine(line)
          }
          if (line.includes("month:") || line.includes("month =")) {
            currentRecord.month = extractNumberFromLine(line)
          }
          if (line.includes("foraDePontaKWh:") || line.includes("foraDePontaKWh =")) {
            currentRecord.foraDePontaKWh = extractNumberFromLine(line)
          }
          if (line.includes("intermediarioKWh:") || line.includes("intermediarioKWh =")) {
            currentRecord.intermediarioKWh = extractNumberFromLine(line)
          }
          if (line.includes("pontaKWh:") || line.includes("pontaKWh =")) {
            currentRecord.pontaKWh = extractNumberFromLine(line)
          }
        }

        // Add the last record if it exists
        if (Object.keys(currentRecord).length > 0) {
          records.push({
            id: recordCount,
            ...currentRecord,
            monthName: getMonthName(currentRecord.month || 0),
          })
        }

        if (records.length > 0) {
          return records
        }
      }

      return null
    } catch (error) {
      console.error("Error extracting contract data:", error)
      addLog(`Error extracting contract data: ${error.message}`)
      return null
    }
  }

  // Extract a single record from Nebula API response
  const extractSingleRecordFromResponse = (response, year, month) => {
    try {
      // Log the response for debugging
      console.log("Raw Nebula response for single record:", response)

      // Try to find JSON data in the response
      const jsonMatches =
        response.match(/```json\s*([\s\S]*?)\s*```/) ||
        response.match(/```\s*([\s\S]*?)\s*```/) ||
        response.match(/\{\s*"[\w]+"[\s\S]*?\}/)

      if (jsonMatches) {
        let jsonStr = jsonMatches[0]
        // Clean up the string if it's wrapped in code blocks
        jsonStr = jsonStr.replace(/```json|```/g, "").trim()

        const jsonData = JSON.parse(jsonStr)

        return {
          id: 1,
          year: Number(jsonData.year || year),
          month: Number(jsonData.month || month),
          monthName: getMonthName(Number(jsonData.month || month)),
          foraDePontaKWh: Number(jsonData.foraDePontaKWh || 0),
          intermediarioKWh: Number(jsonData.intermediarioKWh || 0),
          pontaKWh: Number(jsonData.pontaKWh || 0),
        }
      }

      // Try to extract data from text description
      if (
        response.includes("foraDePontaKWh") &&
        response.includes("intermediarioKWh") &&
        response.includes("pontaKWh")
      ) {
        const record = {
          id: 1,
          year: year,
          month: month,
          monthName: getMonthName(month),
          foraDePontaKWh: 0,
          intermediarioKWh: 0,
          pontaKWh: 0,
        }

        const lines = response.split("\n")

        for (const line of lines) {
          if (line.includes("year:") || line.includes("year =")) {
            record.year = extractNumberFromLine(line)
          }
          if (line.includes("month:") || line.includes("month =")) {
            record.month = extractNumberFromLine(line)
            record.monthName = getMonthName(record.month)
          }
          if (line.includes("foraDePontaKWh:") || line.includes("foraDePontaKWh =")) {
            record.foraDePontaKWh = extractNumberFromLine(line)
          }
          if (line.includes("intermediarioKWh:") || line.includes("intermediarioKWh =")) {
            record.intermediarioKWh = extractNumberFromLine(line)
          }
          if (line.includes("pontaKWh:") || line.includes("pontaKWh =")) {
            record.pontaKWh = extractNumberFromLine(line)
          }
        }

        // Check if we found any data
        if (record.foraDePontaKWh > 0 || record.intermediarioKWh > 0 || record.pontaKWh > 0) {
          return record
        }
      }

      return null
    } catch (error) {
      console.error("Error extracting single record:", error)
      addLog(`Error extracting record data: ${error.message}`)
      return null
    }
  }

  // Helper function to extract numbers from text lines
  const extractNumberFromLine = (line) => {
    const matches = line.match(/\d+/)
    return matches ? Number.parseInt(matches[0]) : 0
  }

  // Helper function to get sample data for a specific month
  const getSampleRecordForMonth = (month) => {
    const sampleData = getSampleEnergyData()
    const monthRecord = sampleData.find((record) => record.month === month)

    if (monthRecord) {
      return monthRecord
    }

    // If no record found for the month, create one
    return {
      id: 1,
      year: year,
      month: month,
      monthName: getMonthName(month),
      foraDePontaKWh: 1200 + Math.floor(Math.random() * 200),
      intermediarioKWh: 300 + Math.floor(Math.random() * 50),
      pontaKWh: 500 + Math.floor(Math.random() * 50),
    }
  }

  // Helper function to get sample energy data
  const getSampleEnergyData = () => {
    return [
      { id: 1, year: 2023, month: 1, monthName: "January", foraDePontaKWh: 1200, intermediarioKWh: 300, pontaKWh: 500 },
      {
        id: 2,
        year: 2023,
        month: 2,
        monthName: "February",
        foraDePontaKWh: 1150,
        intermediarioKWh: 280,
        pontaKWh: 490,
      },
      { id: 3, year: 2023, month: 3, monthName: "March", foraDePontaKWh: 1300, intermediarioKWh: 320, pontaKWh: 510 },
      { id: 4, year: 2023, month: 4, monthName: "April", foraDePontaKWh: 1250, intermediarioKWh: 310, pontaKWh: 505 },
      { id: 5, year: 2023, month: 5, monthName: "May", foraDePontaKWh: 1180, intermediarioKWh: 290, pontaKWh: 495 },
    ]
  }

  // Helper function to get month name from month number
  const getMonthName = (month) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    return monthNames[month - 1] || `Month ${month}`
  }

  const predictNextMonth = async () => {
    setLoading(true)
    setPrediction(null)
    setError(null)

    try {
      if (energyRecords.length === 0) {
        throw new Error("No energy records available. Please fetch records first.")
      }

      // Check for required environment variables
      if (!secretKey) {
        const key = import.meta.env.VITE_THIRDWEB_SECRET_KEY
        if (!key) {
          throw new Error("VITE_THIRDWEB_SECRET_KEY is missing in environment variables")
        }
        setSecretKey(key)
      }

      // Prepare the data for the prediction
      const recordsToUse = energyRecords.slice(-3) // Use last 3 records if available
      const dataForPrediction = recordsToUse.map((record) => ({
        year: record.year,
        month: record.month,
        monthName: record.monthName,
        foraDePontaKWh: record.foraDePontaKWh,
        intermediarioKWh: record.intermediarioKWh,
        pontaKWh: record.pontaKWh,
      }))

      addLog("Sending energy data to Nebula API for prediction...")
      addLog(`Using ${recordsToUse.length} records for prediction${useSampleData ? " (sample data)" : ""}`)

      // Call Nebula API for prediction
      const response = await fetch("https://nebula-api.thirdweb.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-secret-key": secretKey,
        },
        body: JSON.stringify({
          message: `Based on this energy consumption data: ${JSON.stringify(dataForPrediction)}, predict the energy consumption for next month for foraDePontaKWh, intermediarioKWh, and pontaKWh. Return the prediction as a JSON object with these three values.`,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed with status ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      addLog("Prediction received from Nebula API")

      // Extract the prediction from the response
      if (data.response) {
        // Try to extract JSON from the response text
        try {
          // Look for JSON in the response
          const jsonMatch =
            data.response.match(/```json\s*([\s\S]*?)\s*```/) ||
            data.response.match(/```\s*([\s\S]*?)\s*```/) ||
            data.response.match(/{[\s\S]*?}/)

          let predictionData
          if (jsonMatch) {
            let jsonStr = jsonMatch[0]
            // Clean up the string if it's wrapped in code blocks
            jsonStr = jsonStr.replace(/```json|```/g, "").trim()
            predictionData = JSON.parse(jsonStr)
          } else {
            // If no JSON found, create a structured prediction from the text
            predictionData = {
              prediction: data.response,
              raw: data.response,
            }
          }

          setPrediction(predictionData)
          addLog("Successfully parsed prediction data")
        } catch (e) {
          console.error("Error parsing prediction:", e)
          // If parsing fails, still show the raw response
          setPrediction({
            raw: data.response,
            error: "Could not parse structured data from response",
          })
          addLog("Received prediction but couldn't parse structured data")
        }
      } else {
        addLog("No prediction found in the response")
      }
    } catch (error) {
      setError(error.message)
      addLog(`Error: ${error.message}`)
      if (error.cause) {
        addLog(`Cause: ${error.cause}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Energy Consumption Analyzer</h1>

      <div className="mb-6">
        {/* Fetch Method Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Fetch Energy Records</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Fetch Method</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="allRecords"
                      checked={fetchMethod === "allRecords"}
                      onChange={() => setFetchMethod("allRecords")}
                      className="mr-2"
                    />
                    <span>All Records</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="getRecord"
                      checked={fetchMethod === "getRecord"}
                      onChange={() => setFetchMethod("getRecord")}
                      className="mr-2"
                    />
                    <span>Specific Record</span>
                  </label>
                </div>
              </div>

              {fetchMethod === "getRecord" && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number.parseInt(e.target.value))}
                      className="w-full p-2 border rounded"
                      min="2000"
                      max="2100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Month</label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(Number.parseInt(e.target.value))}
                      className="w-full p-2 border rounded"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {getMonthName(m)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                onClick={fetchEnergyRecords}
                disabled={loading}
                className={`w-full p-3 rounded font-medium ${
                  loading ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {loading ? "Loading..." : `Fetch ${fetchMethod === "allRecords" ? "All Records" : "Record"}`}
              </button>
            </div>

            <div className="flex-1">
              <button
                onClick={predictNextMonth}
                disabled={loading || energyRecords.length === 0}
                className={`w-full p-3 rounded font-medium ${
                  loading || energyRecords.length === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {loading ? "Processing..." : "Predict Next Month"}
              </button>

              {energyRecords.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">Fetch energy records first to enable prediction</p>
              )}

              {useSampleData && energyRecords.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="text-yellow-700">
                    <strong>Note:</strong> Using sample data because contract data could not be retrieved.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Energy Records Table */}
        {energyRecords.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <h2 className="text-lg font-medium mb-3">Energy Consumption Records</h2>
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Year</th>
                  <th className="py-2 px-4 border-b">Month</th>
                  <th className="py-2 px-4 border-b">Fora De Ponta (kWh)</th>
                  <th className="py-2 px-4 border-b">Intermediário (kWh)</th>
                  <th className="py-2 px-4 border-b">Ponta (kWh)</th>
                  <th className="py-2 px-4 border-b">Total (kWh)</th>
                </tr>
              </thead>
              <tbody>
                {energyRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="py-2 px-4 border-b">{record.year}</td>
                    <td className="py-2 px-4 border-b">{record.monthName}</td>
                    <td className="py-2 px-4 border-b text-right">{record.foraDePontaKWh.toLocaleString()}</td>
                    <td className="py-2 px-4 border-b text-right">{record.intermediarioKWh.toLocaleString()}</td>
                    <td className="py-2 px-4 border-b text-right">{record.pontaKWh.toLocaleString()}</td>
                    <td className="py-2 px-4 border-b text-right font-medium">
                      {(record.foraDePontaKWh + record.intermediarioKWh + record.pontaKWh).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Prediction Results */}
        {prediction && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h2 className="text-blue-800 font-medium mb-3">Next Month Prediction</h2>

            {prediction.foraDePontaKWh && prediction.intermediarioKWh && prediction.pontaKWh ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded shadow">
                  <h3 className="text-sm text-gray-500 mb-1">Fora De Ponta</h3>
                  <p className="text-2xl font-bold">{Number(prediction.foraDePontaKWh).toLocaleString()} kWh</p>
                </div>
                <div className="p-4 bg-white rounded shadow">
                  <h3 className="text-sm text-gray-500 mb-1">Intermediário</h3>
                  <p className="text-2xl font-bold">{Number(prediction.intermediarioKWh).toLocaleString()} kWh</p>
                </div>
                <div className="p-4 bg-white rounded shadow">
                  <h3 className="text-sm text-gray-500 mb-1">Ponta</h3>
                  <p className="text-2xl font-bold">{Number(prediction.pontaKWh).toLocaleString()} kWh</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white rounded">
                <p className="mb-2 font-medium">AI Response:</p>
                <p className="whitespace-pre-wrap">{prediction.raw}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-600 font-medium mb-1">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="border rounded">
        <h2 className="font-medium p-3 border-b">Logs</h2>
        <div className="h-64 overflow-y-auto p-3 bg-gray-50">
          {logs.length === 0 ? (
            <p className="text-gray-500">Logs will appear here when you perform an action</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 text-sm">
                <span className="text-gray-500 mr-2">[{log.time}]</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default EnergyConsumptionAnalyzer
