"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, SkipForward, Square, Volume2, Music, Users, Server, AlertCircle, Power } from "lucide-react"

interface BotStatus {
  botOnline: boolean
  guilds: number
  users: number
  players: number
  nodes: Array<{
    identifier: string
    connected: boolean
    stats: any
  }>
}

interface Player {
  guildId: string
  voiceChannel: string
  textChannel: string
  connected: boolean
  playing: boolean
  paused: boolean
  position: number
  volume: number
  current: {
    title: string
    author: string
    duration: number
    uri: string
    thumbnail?: string
  } | null
  queue: Array<{
    title: string
    author: string
    duration: number
  }>
}

export default function Dashboard() {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGuild, setSelectedGuild] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState("player")
  const [startingBot, setStartingBot] = useState(false)

  useEffect(() => {
    fetchBotStatus()
    fetchPlayers()

    const interval = setInterval(() => {
      fetchBotStatus()
      fetchPlayers()
    }, 3000) // Check every 3 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchBotStatus = async () => {
    try {
      const response = await fetch("/api/bot/status")
      const data = await response.json()
      setBotStatus(data)
      if (data.error && !data.botOnline) {
        setError(data.error)
      } else {
        setError("")
      }
    } catch (error) {
      console.error("Failed to fetch bot status:", error)
      setError("Failed to connect to bot API")
    }
  }

  const fetchPlayers = async () => {
    try {
      const response = await fetch("/api/bot/players")
      const data = await response.json()
      setPlayers(data)
      if (data.length > 0 && !selectedGuild) {
        setSelectedGuild(data[0].guildId)
      }
    } catch (error) {
      console.error("Failed to fetch players:", error)
    }
  }

  const startBot = async () => {
    setStartingBot(true)
    try {
      const response = await fetch("/api/bot/start", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        setError("")
        // Refresh status after starting
        setTimeout(() => {
          fetchBotStatus()
          fetchPlayers()
        }, 2000)
      } else {
        setError(data.error || "Failed to start bot")
      }
    } catch (error) {
      console.error("Failed to start bot:", error)
      setError("Failed to start bot")
    } finally {
      setStartingBot(false)
    }
  }

  const controlPlayer = async (action: string, query?: string) => {
    if (!selectedGuild) return

    setLoading(true)
    try {
      const response = await fetch("/api/bot/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, guildId: selectedGuild, query }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to control player")
      } else {
        setError("")
        // Refresh players after successful action
        setTimeout(fetchPlayers, 1000)
      }
    } catch (error) {
      console.error("Failed to control player:", error)
      setError("Failed to control player")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const currentPlayer = players.find((p) => p.guildId === selectedGuild)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Discord Music Bot Dashboard</h1>
        <div className="flex items-center gap-4">
          {!botStatus?.botOnline && (
            <button
              onClick={startBot}
              disabled={startingBot}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <Power className="mr-2 h-4 w-4" />
              {startingBot ? "Starting..." : "Start Bot"}
            </button>
          )}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              botStatus?.botOnline
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }`}
          >
            {botStatus?.botOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800">
          <AlertCircle className="flex-shrink-0 inline w-4 h-4 mr-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Bot Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Server className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Servers</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{botStatus?.guilds || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Users</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{botStatus?.users || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Music className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Players</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">{botStatus?.players || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={`h-6 w-6 rounded-full ${botStatus?.nodes.some((n) => n.connected) ? "bg-green-500" : "bg-red-500"}`}
                />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Lavalink Nodes</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {botStatus?.nodes.filter((n) => n.connected).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Selection */}
      {players.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Select Server</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose a server to control its music player</p>
            <div className="mt-4 flex gap-2 flex-wrap">
              {players.map((player) => (
                <button
                  key={player.guildId}
                  onClick={() => setSelectedGuild(player.guildId)}
                  className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    selectedGuild === player.guildId
                      ? "border-transparent text-white bg-blue-600 hover:bg-blue-700"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  Server {player.guildId.slice(-4)}
                  {player.playing && <Music className="ml-2 h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Music Controls */}
      {currentPlayer && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("player")}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "player"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Player
              </button>
              <button
                onClick={() => setActiveTab("queue")}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "queue"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Queue
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "player" && (
              <div className="space-y-6">
                {currentPlayer.current ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Image
                          src={currentPlayer.current.thumbnail || "/placeholder.svg"}
                          alt="Track thumbnail"
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {currentPlayer.current.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{currentPlayer.current.author}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Duration: {formatTime(currentPlayer.current.duration)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(currentPlayer.position / currentPlayer.current.duration) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatTime(currentPlayer.position)}</span>
                        <span>{formatTime(currentPlayer.current.duration)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Nothing is currently playing</p>
                )}

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => controlPlayer(currentPlayer.paused ? "play" : "pause")}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {currentPlayer.paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => controlPlayer("skip")}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <SkipForward className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => controlPlayer("stop")}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Square className="h-5 w-5" />
                  </button>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Volume Control */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Volume: {currentPlayer.volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentPlayer.volume}
                    onChange={(e) => controlPlayer("volume", e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              </div>
            )}

            {activeTab === "queue" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Search & Add to Queue</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search for a song or paste URL..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && searchQuery.trim()) {
                          controlPlayer("play", searchQuery)
                          setSearchQuery("")
                        }
                      }}
                      className="flex-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                    <button
                      onClick={() => {
                        if (searchQuery.trim()) {
                          controlPlayer("play", searchQuery)
                          setSearchQuery("")
                        }
                      }}
                      disabled={loading || !searchQuery.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Queue ({currentPlayer.queue.length})
                  </h3>
                  <div className="max-h-64 overflow-y-auto">
                    {currentPlayer.queue.length > 0 ? (
                      <div className="space-y-2">
                        {currentPlayer.queue.map((track, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900 dark:text-white">{track.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{track.author}</p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(track.duration)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Music className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Queue is empty</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {players.length === 0 && botStatus?.botOnline && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="text-center py-12 px-6">
            <Music className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Players</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Use slash commands in Discord to start playing music, then control it from here.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>
                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">/play [song name or URL]</code> -
                Play music
              </p>
              <p>
                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">/pause</code> - Pause playback
              </p>
              <p>
                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">/skip</code> - Skip current song
              </p>
              <p>
                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">/queue</code> - Show queue
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
