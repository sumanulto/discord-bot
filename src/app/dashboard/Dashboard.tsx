"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Volume2,
  VolumeX,
  Music,
  Server,
  AlertCircle,
  Power,
  RotateCcw,
  Search,
  Plus,
  MoreVertical,
  Shuffle,
  Repeat,
  Heart,
  Download,
} from "lucide-react"

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
  const [activeView, setActiveView] = useState("player")
  const [startingBot, setStartingBot] = useState(false)
  const [restartingBot, setRestartingBot] = useState(false)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [isSeekingTimeline, setIsSeekingTimeline] = useState(false)

  useEffect(() => {
    fetchBotStatus()
    fetchPlayers()

    const interval = setInterval(() => {
      if (!isSeekingTimeline) {
        fetchBotStatus()
        fetchPlayers()
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [isSeekingTimeline])

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

  const stopBot = async () => {
    try {
      const response = await fetch("/api/bot/stop", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        setBotStatus((prev) => (prev ? { ...prev, botOnline: false } : null))
        setPlayers([])
        setError("")
      }
    } catch (error) {
      setError("Failed to stop bot")
    }
  }

  const restartBot = async () => {
    setRestartingBot(true)
    try {
      await stopBot()
      setTimeout(async () => {
        await startBot()
        setRestartingBot(false)
      }, 2000)
    } catch (error) {
      setRestartingBot(false)
      setError("Failed to restart bot")
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
        setTimeout(fetchPlayers, 500)
      }
    } catch (error) {
      console.error("Failed to control player:", error)
      setError("Failed to control player")
    } finally {
      setLoading(false)
    }
  }

  const seekToPosition = async (percentage: number) => {
    if (!currentPlayer?.current) return

    const newPosition = Math.floor((percentage / 100) * currentPlayer.current.duration)
    await controlPlayer("seek", newPosition.toString())
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    controlPlayer("volume", newVolume.toString())
  }

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      controlPlayer("volume", volume.toString())
    } else {
      setIsMuted(true)
      controlPlayer("volume", "0")
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getServerName = (guildId: string) => {
    const serverNames = {
      [process.env.NEXT_PUBLIC_SERVER_1_ID || ""]: "Kraftamine",
      [process.env.NEXT_PUBLIC_SERVER_2_ID || ""]: "PP'S Server",
      [process.env.NEXT_PUBLIC_SERVER_3_ID || ""]: "Music Server",
    }
    return serverNames[guildId] || `Server ${guildId.slice(-4)}`
  }

  const currentPlayer = players.find((p) => p.guildId === selectedGuild)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold">Discord Music</h1>
            </div>
          </div>

          {/* Bot Controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={startBot}
                disabled={startingBot || botStatus?.botOnline}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 rounded-full text-sm font-medium transition-colors"
              >
                <Power className="h-4 w-4 mr-1 inline" />
                {startingBot ? "Starting..." : "Start"}
              </button>

              <button
                onClick={restartBot}
                disabled={restartingBot || !botStatus?.botOnline}
                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 rounded-full text-sm font-medium transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-1 inline" />
                {restartingBot ? "Restarting..." : "Restart"}
              </button>

              <button
                onClick={stopBot}
                disabled={!botStatus?.botOnline}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 rounded-full text-sm font-medium transition-colors"
              >
                <Square className="h-4 w-4 mr-1 inline" />
                Stop
              </button>
            </div>

            <span
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                botStatus?.botOnline ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
              }`}
            >
              {botStatus?.botOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800">
          <div className="p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveView("player")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeView === "player" ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Music className="h-5 w-5 inline mr-3" />
                Player
              </button>
              <button
                onClick={() => setActiveView("servers")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeView === "servers" ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Server className="h-5 w-5 inline mr-3" />
                Servers
              </button>
            </nav>
          </div>

          {/* Server List */}
          <div className="px-4 pb-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Active Servers</h3>
            <div className="space-y-2">
              {players.map((player) => (
                <button
                  key={player.guildId}
                  onClick={() => setSelectedGuild(player.guildId)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedGuild === player.guildId ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{getServerName(player.guildId)}</span>
                    {player.playing && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-3 bg-red-500 rounded animate-pulse"></div>
                        <div
                          className="w-1 h-3 bg-red-500 rounded animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-1 h-3 bg-red-500 rounded animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="px-4 pb-4 border-t border-gray-800 pt-4">
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Servers</span>
                <span>{botStatus?.guilds || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Users</span>
                <span>{botStatus?.users || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Players</span>
                <span>{botStatus?.players || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Nodes</span>
                <span className={botStatus?.nodes.some((n) => n.connected) ? "text-green-400" : "text-red-400"}>
                  {botStatus?.nodes.filter((n) => n.connected).length || 0}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 mx-6 mt-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {activeView === "player" && currentPlayer && (
            <div className="flex-1 flex">
              {/* Player Content */}
              <div className="flex-1 p-6">
                {currentPlayer.current ? (
                  <div className="max-w-4xl mx-auto">
                    {/* Now Playing */}
                    <div className="flex items-start space-x-6 mb-8">
                      <div className="relative">
                        <Image
                          src={currentPlayer.current.thumbnail || "/placeholder.svg"}
                          alt="Album art"
                          width={240}
                          height={240}
                          className="w-60 h-60 rounded-lg shadow-2xl object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div>
                      </div>

                      <div className="flex-1 pt-4">
                        <h1 className="text-3xl font-bold mb-2 text-white">{currentPlayer.current.title}</h1>
                        <p className="text-xl text-gray-300 mb-4">{currentPlayer.current.author}</p>

                        <div className="flex items-center space-x-4 mb-6">
                          <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                            <Heart className="h-6 w-6" />
                          </button>
                          <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                            <Download className="h-6 w-6" />
                          </button>
                          <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                            <MoreVertical className="h-6 w-6" />
                          </button>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-400 w-12 text-right">
                              {formatTime(currentPlayer.position)}
                            </span>
                            <div className="flex-1 relative">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={(currentPlayer.position / currentPlayer.current.duration) * 100}
                                onChange={(e) => {
                                  setIsSeekingTimeline(true)
                                  seekToPosition(Number(e.target.value))
                                  setTimeout(() => setIsSeekingTimeline(false), 1000)
                                }}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentPlayer.position / currentPlayer.current.duration) * 100}%, #374151 ${(currentPlayer.position / currentPlayer.current.duration) * 100}%, #374151 100%)`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-400 w-12">
                              {formatTime(currentPlayer.current.duration)}
                            </span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center space-x-4 mt-6">
                          <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                            <Shuffle className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => controlPlayer("previous")}
                            className="p-3 hover:bg-gray-800 rounded-full transition-colors"
                          >
                            <SkipBack className="h-6 w-6" />
                          </button>

                          <button
                            onClick={() => controlPlayer(currentPlayer.paused ? "play" : "pause")}
                            disabled={loading}
                            className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors disabled:opacity-50"
                          >
                            {currentPlayer.paused ? <Play className="h-8 w-8 ml-1" /> : <Pause className="h-8 w-8" />}
                          </button>

                          <button
                            onClick={() => controlPlayer("skip")}
                            disabled={loading}
                            className="p-3 hover:bg-gray-800 rounded-full transition-colors"
                          >
                            <SkipForward className="h-6 w-6" />
                          </button>

                          <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                            <Repeat className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Volume */}
                        <div className="flex items-center justify-center space-x-3 mt-6">
                          <button onClick={toggleMute} className="p-2 hover:bg-gray-800 rounded-full">
                            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                          </button>
                          <div className="w-32">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={isMuted ? 0 : volume}
                              onChange={(e) => handleVolumeChange(Number(e.target.value))}
                              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${isMuted ? 0 : volume}%, #374151 ${isMuted ? 0 : volume}%, #374151 100%)`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-8">{isMuted ? 0 : volume}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Music className="h-24 w-24 mx-auto text-gray-600 mb-4" />
                      <h2 className="text-2xl font-semibold text-gray-300 mb-2">No music playing</h2>
                      <p className="text-gray-500">Use Discord commands to start playing music</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Queue Sidebar */}
              <div className="w-80 bg-gray-900 border-l border-gray-800 p-4">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search songs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && searchQuery.trim()) {
                          controlPlayer("play", searchQuery)
                          setSearchQuery("")
                        }
                      }}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                    />
                    <button
                      onClick={() => {
                        if (searchQuery.trim()) {
                          controlPlayer("play", searchQuery)
                          setSearchQuery("")
                        }
                      }}
                      disabled={!searchQuery.trim()}
                      className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Queue ({currentPlayer?.queue.length || 0})</h3>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {currentPlayer?.queue.map((track, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{track.title}</p>
                          <p className="text-xs text-gray-400 truncate">{track.author}</p>
                        </div>
                        <span className="text-xs text-gray-500">{formatTime(track.duration)}</span>
                      </div>
                    ))}
                  </div>

                  {!currentPlayer?.queue.length && (
                    <div className="text-center py-8">
                      <Music className="h-12 w-12 mx-auto text-gray-600 mb-2" />
                      <p className="text-gray-500 text-sm">Queue is empty</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === "servers" && (
            <div className="flex-1 p-6">
              <h2 className="text-2xl font-bold mb-6">Server Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {players.map((player) => (
                  <div key={player.guildId} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{getServerName(player.guildId)}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          player.connected ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                        }`}
                      >
                        {player.connected ? "Connected" : "Disconnected"}
                      </span>
                    </div>

                    {player.current && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-3">
                          <Image
                            src={player.current.thumbnail || "/placeholder.svg"}
                            alt="Track"
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{player.current.title}</p>
                            <p className="text-xs text-gray-400 truncate">{player.current.author}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={player.playing ? "text-green-400" : "text-gray-400"}>
                          {player.playing ? "Playing" : player.paused ? "Paused" : "Stopped"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Queue:</span>
                        <span>{player.queue.length} songs</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volume:</span>
                        <span>{player.volume}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedGuild(player.guildId)}
                      className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Control Player
                    </button>
                  </div>
                ))}
              </div>

              {players.length === 0 && (
                <div className="text-center py-12">
                  <Server className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Active Servers</h3>
                  <p className="text-gray-500">Start playing music in Discord to see servers here</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          box-shadow: 0 0 2px 0 #000;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 2px 0 #000;
        }
      `}</style>
    </div>
  )
}
