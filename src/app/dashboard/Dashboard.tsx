"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  Menu,
  Music2,
  ChevronDown,
  Cpu,
  Users,
} from "lucide-react";

interface BotStatus {
  botOnline: boolean;
  guilds: number;
  users: number;
  players: number;
  nodes: Array<{
    identifier: string;
    connected: boolean;
    stats: any;
  }>;
}

interface Player {
  guildId: string;
  voiceChannel: string;
  textChannel: string;
  connected: boolean;
  playing: boolean;
  paused: boolean;
  position: number;
  volume: number;
  current: {
    title: string;
    author: string;
    duration: number;
    uri: string;
    thumbnail?: string;
  } | null;
  queue: Array<{
    title: string;
    author: string;
    duration: number;
  }>;
}

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuild, setSelectedGuild] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeView, setActiveView] = useState("player");
  const [startingBot, setStartingBot] = useState(false);
  const [restartingBot, setRestartingBot] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeekingTimeline, setIsSeekingTimeline] = useState(false);
  const [isStateButtonOpen, setIsStateButtonOpen] = useState(false);

  useEffect(() => {
    fetchBotStatus();
    fetchPlayers();

    const interval = setInterval(() => {
      if (!isSeekingTimeline) {
        fetchBotStatus();
        fetchPlayers();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isSeekingTimeline]);

  const fetchBotStatus = async () => {
    try {
      const response = await fetch("/api/bot/status");
      const data = await response.json();
      setBotStatus(data);
      if (data.error && !data.botOnline) {
        setError(data.error);
      } else {
        setError("");
      }
    } catch (error) {
      console.error("Failed to fetch bot status:", error);
      setError("Failed to connect to bot API");
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch("/api/bot/players");
      const data = await response.json();
      setPlayers(data);
      if (data.length > 0 && !selectedGuild) {
        setSelectedGuild(data[0].guildId);
      }
    } catch (error) {
      console.error("Failed to fetch players:", error);
    }
  };

  const startBot = async () => {
    setStartingBot(true);
    try {
      const response = await fetch("/api/bot/start", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setError("");
        setTimeout(() => {
          fetchBotStatus();
          fetchPlayers();
        }, 2000);
      } else {
        setError(data.error || "Failed to start bot");
      }
    } catch (error) {
      console.error("Failed to start bot:", error);
      setError("Failed to start bot");
    } finally {
      setStartingBot(false);
    }
  };

  const stopBot = async () => {
    try {
      const response = await fetch("/api/bot/stop", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setBotStatus((prev) => (prev ? { ...prev, botOnline: false } : null));
        setPlayers([]);
        setError("");
      }
    } catch (error) {
      setError("Failed to stop bot");
    }
  };

  const restartBot = async () => {
    setRestartingBot(true);
    try {
      await stopBot();
      setTimeout(async () => {
        await startBot();
        setRestartingBot(false);
      }, 2000);
    } catch (error) {
      setRestartingBot(false);
      setError("Failed to restart bot");
    }
  };

  const controlPlayer = async (action: string, query?: string) => {
    if (!selectedGuild) return;

    setLoading(true);
    try {
      const response = await fetch("/api/bot/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, guildId: selectedGuild, query }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to control player");
      } else {
        setError("");
        setTimeout(fetchPlayers, 500);
      }
    } catch (error) {
      console.error("Failed to control player:", error);
      setError("Failed to control player");
    } finally {
      setLoading(false);
    }
  };

  const seekToPosition = async (percentage: number) => {
    if (!currentPlayer?.current) return;

    const newPosition = Math.floor(
      (percentage / 100) * currentPlayer.current.duration
    );
    await controlPlayer("seek", newPosition.toString());
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    controlPlayer("volume", newVolume.toString());
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      controlPlayer("volume", volume.toString());
    } else {
      setIsMuted(true);
      controlPlayer("volume", "0");
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getServerName = (guildId: string) => {
    const serverNames = {
      [process.env.NEXT_PUBLIC_SERVER_1_ID || ""]: "Kraftamine",
      [process.env.NEXT_PUBLIC_SERVER_2_ID || ""]: "PP'S Server",
      [process.env.NEXT_PUBLIC_SERVER_3_ID || ""]: "Music Server",
    };
    return serverNames[guildId] || `Server ${guildId.slice(-4)}`;
  };

  const controlButtons = [
    {
      label: startingBot ? "Starting..." : "Start",
      icon: <Power className="h-4 w-4" />,
      onClick: startBot,
      disabled: startingBot || botStatus?.botOnline,
    },
    {
      label: restartingBot ? "Restarting..." : "Restart",
      icon: <RotateCcw className="h-4 w-4" />,
      onClick: restartBot,
      disabled: restartingBot || !botStatus?.botOnline,
    },
    {
      label: "Stop",
      icon: <Square className="h-4 w-4" />,
      onClick: stopBot,
      disabled: !botStatus?.botOnline,
    },
  ];

  const stats = [
    {
      label: "Servers",
      value: botStatus?.guilds || 0,
      icon: <Server className="h-5 w-5" />,
    },
    {
      label: "Users",
      value: botStatus?.users || 0,
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Players",
      value: botStatus?.players || 0,
      icon: <Music className="h-5 w-5" />,
    },
    {
      label: "Nodes",
      value: botStatus?.nodes.filter((n) => n.connected).length || 0,
      icon: <Cpu className="h-5 w-5" />,
      className: botStatus?.nodes.some((n) => n.connected)
        ? "text-green-400"
        : "text-red-400",
    },
  ];

  const currentPlayer = players.find((p) => p.guildId === selectedGuild);

  if (!botStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030202] text-white">
        <div className="text-center">
          <Music className="h-16 w-16 mx-auto mb-4 text-gray-500" />
          <h1 className="text-2xl font-semibold">Loading...</h1>
          <p className="text-gray-400">Connecting to the bot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030202] text-white">
      {/* Header */}
      <header className="bg-black border-b border-stone-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 gap-4">
            <Menu
              className="h-6 w-6 text-slate-300"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            />
            <div className="flex items-center space-x-2">
              <div className=" bg-[#D8012A] rounded-full p-1">
                <Music2 className="h-6 w-6 text-slate-50 p-1 font-bold border-slate-50 border rounded-full " />
              </div>

              <h1 className="text-2xl font-bold">Discord Music</h1>
            </div>
          </div>

          {/* Bot Controls */}
          <div className="flex relative items-center space-x-3">
            {/* Status Button */}
            <div className="relative">
              <div className="flex items-center space-x-3 bg-slate-200 rounded-full border border-gray-200 px-4 py-1 cursor-pointer">
                <span className="text-gray-800 text-base">Status</span>
                <div
                  className={`h-2 w-2 rounded-full ${
                    botStatus?.botOnline ? "bg-green-600" : "bg-red-600"
                  }`}
                />
                <span className="text-gray-700">
                  {botStatus?.botOnline ? "Online" : "Offline"}
                </span>
                <ChevronDown
                  onClick={() => setIsStateButtonOpen((prev) => !prev)}
                  className="h-5 w-5 pl-2 border-l-2 border-gray-800 text-gray-700"
                />
              </div>

              {/* Dropdown Controls */}
              {isStateButtonOpen && (
                <div className="absolute flex-col right-0 mt-1 min-w-46 bg-slate-50 text-slate-800 p-3 rounded shadow-lg z-20 flex space-y-2">
                  {controlButtons.map((btn, index) => (
                    <button
                      key={index}
                      onClick={btn.onClick}
                      disabled={btn.disabled}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {btn.icon}
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        {isSidebarOpen ? (
          <aside className="w-64 border-r border-stone-800 relative">
            <div className="p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveView("player")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeView === "player"
                      ? "bg-neutral-800 text-slate-200"
                      : "text-gray-300 hover:bg-neutral-900"
                  }`}
                >
                  <Music className="h-5 w-5 inline mr-3" />
                  Player
                </button>
                <button
                  onClick={() => setActiveView("servers")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeView === "servers"
                      ? "bg-neutral-800 text-white"
                      : "text-slate-300 hover:bg-neutral-900"
                  }`}
                >
                  <Server className="h-5 w-5 inline mr-3" />
                  Servers
                </button>
              </nav>
            </div>

            {/* Server List */}
            <div className="px-4 pb-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                Active Servers
              </h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <button
                    key={player.guildId}
                    onClick={() => setSelectedGuild(player.guildId)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedGuild === player.guildId
                        ? "bg-red-600 text-white"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {getServerName(player.guildId)}
                      </span>
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
            <div className="px-4 pb-4 border-t border-stone-800 pt-4 absolute bottom-0 w-full">
              <div className="space-y-3 text-sm text-gray-400">
                {[
                  { label: "Servers", value: botStatus?.guilds || 0 },
                  { label: "Users", value: botStatus?.users || 0 },
                  { label: "Players", value: botStatus?.players || 0 },
                  {
                    label: "Nodes",
                    value:
                      botStatus?.nodes.filter((n) => n.connected).length || 0,
                    className: botStatus?.nodes.some((n) => n.connected)
                      ? "text-green-400"
                      : "text-red-400",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between ${
                      item.className ? "" : ""
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={item.className || ""}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        ) : (
          <aside className=" border-r border-stone-800 relative">
            <div className="p-2">
              <nav className=" flex flex-col gap-2">
                <button
                  onClick={() => setActiveView("player")}
                  className={`text-left px-3 py-2 rounded-lg flex-col flex items-center justify-center transition-colors ${
                    activeView === "player"
                      ? "bg-neutral-800 text-slate-200"
                      : "text-gray-300 hover:bg-neutral-900"
                  }`}
                >
                  <Music className=" h-6 w-6 inline" />
                  <span className="text-xs">Player</span>
                </button>
                <button
                  onClick={() => setActiveView("servers")}
                  className={` text-left px-3 py-2 rounded-lg flex-col flex items-center justify-center transition-colors ${
                    activeView === "servers"
                      ? "bg-neutral-800 text-white"
                      : "text-slate-300 hover:bg-neutral-900"
                  }`}
                >
                  <Server className="h-6 w-6 inline" />
                  <span className="text-xs">Servers</span>
                </button>
              </nav>
            </div>

            {/* Server List */}
            <div className="px-4 mt-4 pb-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                Active
              </h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <button
                    key={player.guildId}
                    onClick={() => setSelectedGuild(player.guildId)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedGuild === player.guildId
                        ? "bg-red-600 text-white"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {getServerName(player.guildId)?.charAt(0)}
                      </span>
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
            <div className="px-4 pb-4 flex flex-col border-t border-stone-800 pt-4 absolute bottom-0 w-full">
              <div className="flex flex-col gap-2 text-sm text-gray-400">
                {stats.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 justify-center space-y-1"
                  >
                    <div>{item.icon}</div>
                    <div className={item.className || ""}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

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
                  <div className="flex-1 flex h-full flex-col  text-white relative">
                    {/* Fullscreen Image Background */}
                    <div className="flex-1 flex items-center justify-center z-0">
                      <Image
                        src={
                          currentPlayer.current.thumbnail || "/placeholder.svg"
                        }
                        alt="Album Art"
                        width={300}
                        height={300}
                        className="rounded-xl bg-cover shadow-2xl object-cover max-w-96 h-auto"
                      />
                    </div>

                    {/* Foreground Content */}
                    <div className="z-10 flex-1 flex flex-col justify-end px-6 pb-8">
                      <div className="max-w-4xl mx-auto space-y-4">
                        {/* Song Info */}
                        <div>
                          <h1 className="text-4xl font-bold">
                            {currentPlayer.current.title}
                          </h1>
                          <p className="text-lg text-gray-300">
                            {currentPlayer.current.author}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center items-center space-x-4 mt-4">
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
                            onClick={() =>
                              controlPlayer(
                                currentPlayer.paused ? "play" : "pause"
                              )
                            }
                            disabled={loading}
                            className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors disabled:opacity-50"
                          >
                            {currentPlayer.paused ? (
                              <Play className="h-8 w-8 ml-1" />
                            ) : (
                              <Pause className="h-8 w-8" />
                            )}
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

                        {/* Timeline */}
                        <div className="flex items-center space-x-3 w-full">
                          <span className="text-sm text-gray-400 w-12 text-right">
                            {formatTime(currentPlayer.position)}
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={
                              (currentPlayer.position /
                                currentPlayer.current.duration) *
                              100
                            }
                            onChange={(e) => {
                              setIsSeekingTimeline(true);
                              seekToPosition(Number(e.target.value));
                              setTimeout(
                                () => setIsSeekingTimeline(false),
                                1000
                              );
                            }}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
                                (currentPlayer.position /
                                  currentPlayer.current.duration) *
                                100
                              }%, #374151 ${
                                (currentPlayer.position /
                                  currentPlayer.current.duration) *
                                100
                              }%, #374151 100%)`,
                            }}
                          />
                          <span className="text-sm text-gray-400 w-12">
                            {formatTime(currentPlayer.current.duration)}
                          </span>
                        </div>

                        {/* Volume */}
                        <div className="flex items-center justify-center space-x-3 mt-4">
                          <button
                            onClick={toggleMute}
                            className="p-2 hover:bg-gray-800 rounded-full"
                          >
                            {isMuted ? (
                              <VolumeX className="h-5 w-5" />
                            ) : (
                              <Volume2 className="h-5 w-5" />
                            )}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={isMuted ? 0 : volume}
                            onChange={(e) =>
                              handleVolumeChange(Number(e.target.value))
                            }
                            className="w-32 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
                                isMuted ? 0 : volume
                              }%, #374151 ${
                                isMuted ? 0 : volume
                              }%, #374151 100%)`,
                            }}
                          />
                          <span className="text-sm text-gray-400 w-8 text-right">
                            {isMuted ? 0 : volume}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Music className="h-24 w-24 mx-auto text-gray-600 mb-4" />
                      <h2 className="text-2xl font-semibold text-gray-300 mb-2">
                        No music playing
                      </h2>
                      <p className="text-gray-500">
                        Use Discord commands to start playing music
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Queue Sidebar */}
              <div className="w-80">
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
                          controlPlayer("play", searchQuery);
                          setSearchQuery("");
                        }
                      }}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                    />
                    <button
                      onClick={() => {
                        if (searchQuery.trim()) {
                          controlPlayer("play", searchQuery);
                          setSearchQuery("");
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
                  <h3 className="text-lg font-semibold mb-3">
                    Queue ({currentPlayer?.queue.length || 0})
                  </h3>

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
                          <p className="text-sm font-medium text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {track.author}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(track.duration)}
                        </span>
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
                  <div
                    key={player.guildId}
                    className="bg-neutral-700 rounded-lg p-6 border border-stone-800"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {getServerName(player.guildId)}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          player.connected
                            ? "bg-green-900 text-green-300"
                            : "bg-red-900 text-red-300"
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
                            <p className="text-sm font-medium truncate">
                              {player.current.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {player.current.author}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span
                          className={
                            player.playing ? "text-green-400" : "text-gray-400"
                          }
                        >
                          {player.playing
                            ? "Playing"
                            : player.paused
                            ? "Paused"
                            : "Stopped"}
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
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No Active Servers
                  </h3>
                  <p className="text-gray-500">
                    Start playing music in Discord to see servers here
                  </p>
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
  );
}
