"use client"

import { useState, useEffect } from "react"

import { createThirdwebClient, getContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { ConnectButton, useReadContract } from "thirdweb/react"
import { createWallet } from "thirdweb/wallets"
import { Nebula } from "thirdweb/ai" // Import Nebula from thirdweb/ai

import { toTokens } from "thirdweb/utils"

import "./App.css"
import logo from "./assets/EnergIA.png"

export const client = createThirdwebClient({
  clientId: "c7062f04495772cb44711c8202c022dc", // replace with your actual ID
})

export const contract = getContract({
  client,
  address: "0x97c4f62fb13bb6e048e661d2d468d0e183911ea7",
  chain: sepolia,
})

function App() {
  const [enabled, setEnabled] = useState(false)
  const [logs, setLogs] = useState([])
  const [showPrompt, setShowPrompt] = useState(false)
  const [nebulaResponse, setNebulaResponse] = useState("")
  const [isCallingNebula, setIsCallingNebula] = useState(false)

  const addLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, { time: new Date().toLocaleTimeString(), message }])
  }

  const clearLogs = () => {
    setLogs([])
  }

  // useReadContract supports an 'enabled' option
  const { data, isLoading, error, refetch } = useReadContract({
    contract,
    method:
      "function compareTotals() view returns (uint256 sumTotalValor_, uint256 sumFaturadoConvencional_, uint256 sumFaturadoSCEE_)",
    params: [],
    enabled, // only run when enabled is true
  })

  const labels = ["Hourly Tariff Total (R$):", "Flat Tariff Total (R$):", "Solar PV Total (R$):"]

  const wallets = [createWallet("io.metamask")]

  // Generate the Nebula prompt
  const generateNebulaPrompt = () => {
    if (!data) return ""

    // Format the values with 2 decimal places
    const hourlyValue = Number.parseFloat(toTokens(BigInt(data[0]), 2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const flatValue = Number.parseFloat(toTokens(BigInt(data[1]), 2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const solarValue = Number.parseFloat(toTokens(BigInt(data[2]), 2)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    return `Nebula, consider these are costs to final user, please compare "${labels[0]}" ${hourlyValue}, "${labels[1]}" ${flatValue}, "${labels[2]}" ${solarValue} and give the least costly alternative.`
  }

  // Function to call Nebula API
  const callNebulaAPI = async () => {
    const prompt = generateNebulaPrompt()
    if (!prompt) return

    setIsCallingNebula(true)
    addLog("Calling Nebula API...")

    try {
      const response = await Nebula.chat({
        client: client, // Using the existing thirdweb client
        message: prompt,
        contextFilter: {
          chains: [sepolia],
        },
      })

      setNebulaResponse(response.message)
      addLog("Received response from Nebula")
    } catch (err) {
      addLog(`Error calling Nebula API: ${err.message}`)
      console.error("Nebula API error:", err)
    } finally {
      setIsCallingNebula(false)
    }
  }

  // Modified to set showPrompt to true when comparing tariffs
  const handleCompareTariff = () => {
    addLog("Comparing energy tariffs...")
    setEnabled(true)
    setShowPrompt(true)
    setNebulaResponse("") // Clear any previous response
  }

  // Call Nebula API when data is loaded
  useEffect(() => {
    if (data && !isLoading && !error && showPrompt) {
      addLog("Generated Nebula prompt")
      callNebulaAPI() // Automatically call Nebula API when data is loaded
    }
  }, [data, isLoading, error, showPrompt])

  return (
    <div className="container mx-auto p-4">
      <img src={logo || "/placeholder.svg"} alt="logo" width="300 px"></img>
      <h3 className="text-xl font-bold mb-4">Nebula powered AI energy retailing back office agent</h3>
      <p className="mb-4">This is a MVP for showing the AI agent energy retailing capabilities.</p>

      <ConnectButton client={client} chain={sepolia} wallets={wallets} connectModal={{ size: "compact" }} />

      <br />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        style={{ margin: "2rem 0" }}
        onClick={handleCompareTariff}
        disabled={isCallingNebula} // Disable button while calling Nebula
      >
        Compare Energy Tariff
      </button>

      {/* Error message display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-600 font-medium mb-1">Error</h2>
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      {enabled && (
        <div className="mb-6 flex justify-center">
          {isLoading ? (
            <p className="text-blue-600">Loading tariff comparison...</p>
          ) : error ? null : ( // Error is handled separately above
            data && (
              <table
                className="border-collapse min-w-[330px] border-2 border-gray-300"
                style={{
                  borderCollapse: "collapse",
                  minWidth: 330,
                  border: "2px solid #333",
                }}
              >
                <tbody>
                  {labels.map((label, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          border: "1px solid #333",
                          padding: "8px 16px",
                          fontWeight: 600,
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          border: "1px solid #333",
                          padding: "8px 16px",
                        }}
                      >
                        {typeof data[i] !== "undefined"
                          ? Number.parseFloat(toTokens(BigInt(data[i]), 2)).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      )}

      {/* Show Nebula prompt and response */}
      {showPrompt && data && !isLoading && !error && (
        <div className="mb-6 mt-6">
          {/* Nebula prompt */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4">
            <h2 className="text-blue-600 font-medium mb-2">Nebula Prompt</h2>
            <p className="text-blue-700 break-words">{generateNebulaPrompt()}</p>
          </div>

          {/* Nebula response */}
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h2 className="text-green-600 font-medium mb-2">Nebula Response</h2>
            {isCallingNebula ? (
              <p className="text-green-700">Waiting for Nebula's analysis...</p>
            ) : nebulaResponse ? (
              <p className="text-green-700 whitespace-pre-line">{nebulaResponse}</p>
            ) : (
              <p className="text-gray-500">No response from Nebula yet</p>
            )}
          </div>
        </div>
      )}

      {/* Logs display */}
      <div className="border rounded mt-6">
        <div className="flex justify-between items-center p-3 border-b">
          <h2 className="font-medium">Logs</h2>
          <button onClick={clearLogs} className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">
            Clear
          </button>
        </div>
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

export default App
