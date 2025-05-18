"use client"

import { useState, useEffect } from "react"

import { createThirdwebClient, getContract } from "thirdweb"
import { sepolia } from "thirdweb/chains"
import { ConnectButton, useReadContract } from "thirdweb/react"
import { createWallet } from "thirdweb/wallets"
import { Nebula } from "thirdweb/ai"

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

  // Process Nebula response to remove the question at the end
  const processNebulaResponse = (response) => {
    if (!response) return ""

    // Remove any text that starts with "Would you like more details" or similar questions
    return response
      .replace(/Would you like more details.*$|Can I help.*$|Do you need.*$|Is there anything else.*$/i, "")
      .trim()
  }

  // Format the response to preserve bold markdown
  const formatResponse = (text) => {
    if (!text) return { __html: "" }

    // Convert markdown bold (**text**) to HTML bold (<strong>text</strong>)
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    return { __html: formattedText }
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

      // Process the response to remove the question
      const processedResponse = processNebulaResponse(response.message)
      setNebulaResponse(processedResponse)
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
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex flex-col items-start">
        <div className="w-full flex justify-between items-center mb-6">
          <div>
            <img src={logo || "/placeholder.svg"} alt="logo" width="300px" />
          </div>
          <ConnectButton
            client={client}
            chain={sepolia}
            wallets={wallets}
            connectModal={{ size: "compact" }}
            className="ml-auto"
          />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Energy Retailing Back Office Agent</h2>
        <p className="text-gray-600 mb-6">AI-powered analysis for energy tariff comparison</p>

        <div className="w-full mb-8">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200 shadow-sm"
            onClick={handleCompareTariff}
            disabled={isCallingNebula}
          >
            {isCallingNebula ? "Analyzing..." : "Compare Energy Tariffs"}
          </button>
        </div>

        {/* Error message display */}
        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h2 className="text-red-600 font-medium mb-1">Error</h2>
            <p className="text-red-700">{error.message}</p>
          </div>
        )}

        {/* Results section */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tariff comparison table */}
          {enabled && (
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Tariff Comparison</h3>
              {isLoading ? (
                <p className="text-blue-600">Loading tariff data...</p>
              ) : error ? null : (
                data && (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Tariff Type
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Cost (R$)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {labels.map((label, i) => {
                          const value =
                            typeof data[i] !== "undefined"
                              ? Number.parseFloat(toTokens(BigInt(data[i]), 2)).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "--"

                          // Check if this is the lowest value
                          const isLowest =
                            data &&
                            Math.min(
                              ...Array.from({ length: 3 }, (_, idx) => Number(toTokens(BigInt(data[idx]), 2))),
                            ) === Number(toTokens(BigInt(data[i]), 2))

                          return (
                            <tr key={i} className={isLowest ? "bg-green-50" : ""}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {label.replace(":", "")}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm text-right ${isLowest ? "font-bold text-green-700" : "text-gray-500"}`}
                              >
                                {value}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}

          {/* Nebula analysis */}
          {showPrompt && data && !isLoading && !error && (
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Nebula Analysis</h3>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100 p-4">
                {isCallingNebula ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-blue-600">Analyzing tariff options...</p>
                  </div>
                ) : nebulaResponse ? (
                  <div>
                    <p
                      className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={formatResponse(nebulaResponse)}
                    ></p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Waiting for analysis...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logs section */}
        <div className="w-full mt-8 border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Activity Log</h3>
            <button
              onClick={clearLogs}
              className="text-xs bg-white hover:bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-300 transition-colors duration-200"
            >
              Clear
            </button>
          </div>
          <div className="h-48 overflow-y-auto p-4 bg-white">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No activity recorded yet</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1.5 text-sm">
                  <span className="text-gray-400 mr-2 font-mono text-xs">[{log.time}]</span>
                  <span className="text-gray-700">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
