"use client"

import { Music2, Server, Settings, Cpu, Users } from "lucide-react" // Added Cpu, Users for stats icons

interface SidebarProps {
  isSidebarOpen: boolean
  activeView: string
  setActiveView: (view: string) => void
  players: any[]
  selectedGuild: string
  setSelectedGuild: (guildId: string) => void
  getServerName: (guildId: string) => string
  botStatus: any
  stats: { icon: React.ReactNode; value: string; className?: string; label?: string }[] // Added label to stats interface
}

export default function Sidebar({
  isSidebarOpen,
  activeView,
  setActiveView,
  players,
  selectedGuild,
  setSelectedGuild,
  getServerName,
  botStatus,
  stats,
}: SidebarProps) {
  // If sidebar is closed, render the collapsed view
  if (!isSidebarOpen) {
    return (
      <aside className="w-20 border-r border-stone-800 relative bg-neutral-900 flex flex-col items-center py-4">
        <nav className="flex flex-col gap-2 w-full px-2">
          <button
            onClick={() => setActiveView("player")}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors ${
              activeView === "player"
                ? "bg-red-600 text-white"
                : "text-gray-300 hover:bg-neutral-800 hover:text-white"
            }`}
          >
            <Music2 className="h-6 w-6" />
            <span className="text-xs mt-1">Player</span>
          </button>
          <button
            onClick={() => setActiveView("servers")}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors ${
              activeView === "servers"
                ? "bg-red-600 text-white"
                : "text-gray-300 hover:bg-neutral-800 hover:text-white"
            }`}
          >
            <Server className="h-6 w-6" />
            <span className="text-xs mt-1">Servers</span>
          </button>
          <button
            onClick={() => setActiveView("settings")}
            className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors ${
              activeView === "settings"
                ? "bg-red-600 text-white"
                : "text-gray-300 hover:bg-neutral-800 hover:text-white"
            }`}
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </nav>

        {/* Collapsed Server List */}
        <div className="px-2 mt-4 w-full">
          <h3 className="text-xs font-semibold text-gray-400 text-center mb-3 uppercase tracking-wider">
            Active
          </h3>
          <div className="space-y-2">
            {players.map((player) => (
              <button
                key={player.guildId}
                onClick={() => setSelectedGuild(player.guildId)}
                className={`w-full px-1 py-2 rounded-md transition-colors flex flex-col items-center justify-center ${
                  selectedGuild === player.guildId
                    ? "bg-red-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {player.playing && (
                  <div className="flex space-x-0.5 mt-1 h-4 items-end">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <div
                        key={i}
                        className="w-1 bg-white rounded-sm animate-bar"
                        style={{
                          animationDelay: `${delay}s`,
                          animationDuration: "1s",
                          animationIterationCount: "infinite",
                          transformOrigin: "bottom",
                        }}
                      />
                    ))}
                  </div>
                )}
                <span className="text-[9px] text-center truncate w-full mt-1">
                  {getServerName(player.guildId)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Collapsed Stats */}
        <div className="px-2 pb-4 flex flex-col border-t border-stone-800 pt-4 absolute bottom-0 w-full">
          <div className="flex flex-col gap-2 text-sm text-gray-400">
            {stats.map((item, index) => (
              <div key={index} className="flex items-center gap-2 justify-center">
                <div className="h-4 w-4">{item.icon}</div>
                <div className={item.className || ""}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  // Expanded Sidebar View
  return (
    <aside className="w-64 bg-neutral-900 border-r border-stone-800 flex flex-col">
      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        <button
          onClick={() => setActiveView("player")}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
            activeView === "player"
              ? "bg-red-600 text-white"
              : "text-gray-300 hover:bg-neutral-800 hover:text-white"
          }`}
        >
          <Music2 className="h-5 w-5" />
          <span>Player</span>
        </button>
        <button
          onClick={() => setActiveView("servers")}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
            activeView === "servers"
              ? "bg-red-600 text-white"
              : "text-gray-300 hover:bg-neutral-800 hover:text-white"
          }`}
        >
          <Server className="h-5 w-5" />
          <span>Servers</span>
        </button>
        <button
          onClick={() => setActiveView("settings")}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3 ${
            activeView === "settings"
              ? "bg-red-600 text-white"
              : "text-gray-300 hover:bg-neutral-800 hover:text-white"
          }`}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </nav>

      <div className="border-t border-stone-800 my-4" />

      {/* Active Servers - Moved to middle */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar"> {/* Added custom-scrollbar for potentially long lists */}
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Active Servers</h3>
        <div className="space-y-2">
          {players.map((player) => (
            <button
              key={player.guildId}
              onClick={() => {
                setSelectedGuild(player.guildId)
                setActiveView("player")
              }}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedGuild === player.guildId
                  ? "bg-red-600 text-white"
                  : "bg-neutral-800 hover:bg-neutral-700 text-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0"> {/* Added min-w-0 */}
                  <Server className="h-4 w-4 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                  <span className="text-sm font-medium truncate">{getServerName(player.guildId)}</span> {/* Added truncate */}
                </div>
                {player.playing && (
                  <div className="flex space-x-1 flex-shrink-0"> {/* Added flex-shrink-0 */}
                    <div
                      className="w-1 h-3 bg-green-400 rounded animate-bar"
                      style={{ animationDelay: "0ms", animationDuration: "1000ms" }}
                    />
                    <div
                      className="w-1 h-3 bg-green-400 rounded animate-bar"
                      style={{ animationDelay: "200ms", animationDuration: "1000ms" }}
                    />
                    <div
                      className="w-1 h-3 bg-green-400 rounded animate-bar"
                      style={{ animationDelay: "400ms", animationDuration: "1000ms" }}
                    />
                  </div>
                )}
              </div>
              {player.current && <div className="mt-2 text-xs text-gray-400 truncate">{player.current.title}</div>}
            </button>
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-center py-8">
            <Server className="h-8 w-8 mx-auto text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">No active servers</p>
          </div>
        )}
      </div>

      <div className="border-t border-stone-800 my-4" />

      {/* Stats - Moved to last */}
      <div className="px-4 space-y-3 pb-4"> {/* Added pb-4 for padding at the bottom */}
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <div key={index} className="bg-neutral-800 rounded-lg p-3">
              <div className={`flex items-center space-x-2 ${stat.className || "text-gray-300"}`}>
                <div className="h-4 w-4">{stat.icon}</div>
                <div>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="text-sm font-semibold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}