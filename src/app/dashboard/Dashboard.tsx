"use client";
import { useState, useEffect, useRef } from "react"; // Import useRef
import Sidebar from "@/components/ui/SideBar";
import MusicPlayerCard from "@/components/ui/PlayerCard";
import Image from "next/image";
import {
  Square,
  Music,
  Server,
  AlertCircle,
  Power,
  RotateCcw,
  Menu,
  Music2,
  Cpu,
  Users,
  Bot,
  SquareTerminal,
  BadgeCheck,
  BadgeX,
  Triangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface BotStatus {
  botOnline: boolean;
  guilds: number;
  users: number;
  players: number;
  nodes: Array<{
    identifier: string;
    connected: boolean;
    stats: Record<string, unknown>;
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
    thumbnail?: string;
  }>;
}

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<string>("");

  // Create a ref to store the latest selectedGuild state
  const selectedGuildRef = useRef(selectedGuild);

  // Effect to keep the ref updated whenever selectedGuild changes
  useEffect(() => {
    selectedGuildRef.current = selectedGuild;
  }, [selectedGuild]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeView, setActiveView] = useState("player");
  const [startingBot, setStartingBot] = useState(false);
  const [restartingBot, setRestartingBot] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeekingTimeline, setIsSeekingTimeline] = useState(false);
  const [isStateButtonOpen, setIsStateButtonOpen] = useState(false);
  const [showTerminalDialog, setShowTerminalDialog] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [loadingTerminal, setLoadingTerminal] = useState(false);

  useEffect(() => {
    fetchBotStatus();
    // Initial fetch, uses the current selectedGuild state
    fetchPlayers();

    const interval = setInterval(() => {
      if (!isSeekingTimeline) {
        fetchBotStatus();
        // Pass the latest selectedGuild from the ref to the fetchPlayers function
        fetchPlayers(selectedGuildRef.current);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isSeekingTimeline]); // This useEffect now only depends on isSeekingTimeline

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

  // Modified fetchPlayers to accept an optional guildId, primarily for use with useRef
  const fetchPlayers = async (currentGuildIdFromRef?: string) => {
    try {
      const response = await fetch("/api/bot/players");
      const data: Player[] = await response.json();
      setPlayers(data);

      // Determine which selected guild ID to use:
      // 1. If explicitly passed from a ref (for interval calls), use that.
      // 2. Otherwise, use the component's state (for initial calls or direct triggers).
      const guildIdToUse =
        currentGuildIdFromRef !== undefined
          ? currentGuildIdFromRef
          : selectedGuild;

      const currentSelectedGuildExists = data.some(
        (p) => p.guildId === guildIdToUse
      );

      // Debugging: Log before conditional setSelectedGuild
      console.log("--- fetchPlayers Debug ---");
      console.log("Current selectedGuild (from state):", selectedGuild);
      console.log("Current selectedGuild (from ref/param):", guildIdToUse);
      console.log(
        "Does current selected guild exist in new data?",
        currentSelectedGuildExists
      );
      console.log(
        "Fetched players data:",
        data.map((p) => ({
          guildId: p.guildId,
          name: getServerName(p.guildId),
        }))
      );

      // If no guild is currently selected (or guildIdToUse is empty)
      // OR the selected guild is no longer valid in the fetched list,
      // then default to the first player if available.
      if (!guildIdToUse || !currentSelectedGuildExists) {
        if (data.length > 0) {
          console.log(
            `Resetting selectedGuild to: ${data[0].guildId} (from ${
              guildIdToUse || "empty"
            })`
          );
          setSelectedGuild(data[0].guildId);
        } else {
          console.log("Clearing selectedGuild (no players available)");
          setSelectedGuild(""); // No players available, clear selection
        }
      } else {
        console.log("Retaining selectedGuild:", guildIdToUse);
      }
      console.log("--- End fetchPlayers Debug ---");
    } catch {
      console.error("Failed to fetch players:");
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
          fetchPlayers(); // Calls fetchPlayers without an argument, using state's selectedGuild
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
    } catch {
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
        setTimeout(fetchPlayers, 500); // Calls fetchPlayers without an argument, using state's selectedGuild
      }

      // Specifically for seek action, update position immediately for smoother UI
      if (action === "seek" && response.ok && query !== undefined) {
        const newPosition = parseInt(query, 10);
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.guildId === selectedGuild
              ? { ...player, position: newPosition }
              : player
          )
        );
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
      value: String(botStatus?.guilds || 0),
      icon: <Server />,
    },
    {
      label: "Users",
      value: String(botStatus?.users || 0),
      icon: <Users />,
    },
    {
      label: "Players",
      value: String(botStatus?.players || 0),
      icon: <Music2 />,
    },
    {
      label: "Nodes",
      value: String(
        botStatus?.nodes.filter((n: { connected: boolean }) => n.connected)
          .length || 0
      ),
      icon: <Cpu />,
      className: botStatus?.nodes.some(
        (n: { connected: boolean }) => n.connected
      )
        ? "text-green-400"
        : "text-red-400",
    },
  ];

  const currentPlayer = players.find((p) => p.guildId === selectedGuild);

  // Fetch terminal output from backend
  const fetchTerminalOutput = async () => {
    setLoadingTerminal(true);
    try {
      const response = await fetch("/api/bot/terminal");
      const text = await response.text();
      setTerminalOutput(text);
    } catch {
      setTerminalOutput("Failed to load terminal output.");
    } finally {
      setLoadingTerminal(false);
    }
  };

  const getStatusIcon = () => {
    if (showTerminalDialog) {
      return <SquareTerminal className="h-3.5 w-3.5 text-purple-400" />;
    } else if (restartingBot) {
      return ( <RotateCcw className="h-3.5 w-3.5 text-yellow-400 animate-spin-reverse"/>);
    } else if (botStatus?.botOnline) {
      return <BadgeCheck className="h-3.5 w-3.5 text-green-500" />;
    } else {
      return <BadgeX className="h-3.5 w-3.5 text-red-500" />;
    }
  };

  // Open dialog and fetch terminal output
  const openTerminalDialog = () => {
    setShowTerminalDialog(true);
    fetchTerminalOutput();
  };

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
      <header className="border-b h-20 border-stone-800 px-6 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4 gap-4">
            <div
              className="hover:bg-neutral-800 rounded p-2 cursor-pointer border-neutral-800 border"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              <Menu className="h-5 w-5 text-slate-300" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-[#D8012A] rounded-full p-1">
                <Music2 className="h-6 w-6 text-slate-50 p-1 font-bold border-slate-50 border rounded-full" />
              </div>

              <h1 className="text-2xl font-bold">Kraftamine Music</h1>
            </div>
          </div>

          {/* Bot Controls */}
          <div
            className="relative"
            onMouseEnter={() => setIsStateButtonOpen(true)}
            onMouseLeave={() => setIsStateButtonOpen(false)}
          >
            <div className="relative cursor-pointer bg-stone-600 p-2 rounded-full hover:bg-stone-700 transition">
              <Bot className="h-6 w-6 text-gray-300" />

              {/* Status Badge */}
              <div className="absolute -top-1 -right-1 bg-stone-900 rounded-full p-0.5 border border-stone-600">
                {getStatusIcon()}
              </div>
            </div>

            {/* Dropdown */}
            {isStateButtonOpen && (
              <div className="absolute right-0 w-44 z-40  text-gray-800 ">
                  <div className="w-full flex items-end justify-end"><Triangle className="fill-slate-50 gap-0" /> </div>
                <div className="bg-slate-50 rounded-md rounded-tr-none shadow-xl z-30 flex flex-col space-y-2 p-3">
                {controlButtons.map((btn, index) => (
                  <button
                    key={index}
                    onClick={btn.onClick}
                    disabled={btn.disabled}
                    className="flex items-center cursor-pointer justify-start space-x-2 px-3 py-2 hover:bg-gray-100 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {btn.icon}
                    <span className="text-sm">{btn.label}</span>
                  </button>
                ))}

                <div className="border-t border-gray-300 pt-2 mt-2">
                  <button
                    onClick={openTerminalDialog}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-md transition"
                  >
                    
                    <span className="text-sm flex gap-2"> <SquareTerminal className="h-5 w-5" /> Terminal</span>
                  </button>
                </div>
              </div>
              </div>
            )}
            
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          activeView={activeView}
          setActiveView={setActiveView}
          players={players}
          selectedGuild={selectedGuild}
          setSelectedGuild={setSelectedGuild}
          getServerName={getServerName}
          botStatus={botStatus}
          stats={stats}
        />
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
              <MusicPlayerCard
                currentPlayer={currentPlayer}
                volume={volume}
                isMuted={isMuted}
                setVolume={handleVolumeChange}
                toggleMute={toggleMute}
                seekToPosition={seekToPosition}
                controlPlayer={controlPlayer}
                formatTime={formatTime}
                loading={loading}
                setIsSeekingTimeline={setIsSeekingTimeline}
                selectedGuild={selectedGuild}
                fetchPlayers={fetchPlayers}
                isSeekingTimeline={isSeekingTimeline}
              />
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

      {/* Terminal Dialog/Modal using shadcn/ui Dialog */}
      <Dialog open={showTerminalDialog} onOpenChange={setShowTerminalDialog}>
        <DialogContent className="max-w-2xl bg-[#18181b] text-white">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-neutral-700 pb-2">
            <DialogTitle className="font-semibold text-lg">
              Bot Terminal Output
            </DialogTitle>
            <DialogClose asChild></DialogClose>
          </DialogHeader>
          <div
            className="p-2 overflow-auto text-xs font-mono bg-black text-green-400 rounded"
            style={{
              whiteSpace: "pre-wrap",
              minHeight: "300px",
              maxHeight: "50vh",
            }}
          >
            {loadingTerminal ? "Loading..." : terminalOutput}
          </div>
        </DialogContent>
      </Dialog>

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
