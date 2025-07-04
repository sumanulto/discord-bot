"use client";

import { Music, Server } from "lucide-react";
import React from "react";

interface SidebarProps {
  isSidebarOpen: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
  players: any[];
  selectedGuild: string;
  setSelectedGuild: (id: string) => void;
  getServerName: (id: string) => string;
  botStatus: any;
  stats: { icon: React.ReactNode; value: string; className?: string }[];
}

interface NodeStatus {
  connected: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  activeView,
  setActiveView,
  players,
  selectedGuild,
  setSelectedGuild,
  getServerName,
  botStatus,
  stats,
}) => {
  return isSidebarOpen ? (
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
                <span className="text-sm">{getServerName(player.guildId)}</span>
                {player.playing && (
                    <div className="flex space-x-1 mt-1 h-4 items-end">
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <div
                          key={i}
                          className="w-1 bg-white rounded-sm animate-bar"
                          style={{
                            animationDelay: `${delay}s`,
                            animationDuration: "1s",
                            animationIterationCount: "infinite",
                            transformOrigin: "bottom", // critical for bottom growth
                          }}
                        />
                      ))}
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
                botStatus?.nodes.filter((n: NodeStatus) => n.connected)
                  .length || 0,
              className: botStatus?.nodes.some((n: NodeStatus) => n.connected)
                ? "text-green-400"
                : "text-red-400",
            },
          ].map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>{item.label}</span>
              <span className={item.className || ""}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  ) : (
    <aside className="border-r border-stone-800 relative">
      <div className="p-2">
        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setActiveView("player")}
            className={`text-left px-3 py-2 rounded-md flex-col flex items-center justify-center transition-colors ${
              activeView === "player"
                ? "bg-neutral-800 text-slate-200"
                : "text-gray-300 hover:bg-neutral-900"
            }`}
          >
            <Music className="h-6 w-6 inline" />
            <span className="text-xs">Player</span>
          </button>
          <button
            onClick={() => setActiveView("servers")}
            className={`text-left px-3 py-2 rounded-md flex-col flex items-center justify-center transition-colors ${
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
        <h3 className="text-xs font-semibold justify-center text-center text-gray-400 mb-3 uppercase tracking-wider">
          Active
        </h3>
        <div className="space-y-2">
          {players.map((player) => (
            <button
              key={player.guildId}
              onClick={() => setSelectedGuild(player.guildId)}
              className={`w-full px-3 py-2 rounded-md transition-colors ${
                selectedGuild === player.guildId
                  ? "bg-red-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                {/* Server Initial */}
                <span className="">
                  {player.playing && (
                    <div className="flex space-x-1 mt-1 h-4 items-end">
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <div
                          key={i}
                          className="w-1 bg-white rounded-sm animate-bar"
                          style={{
                            animationDelay: `${delay}s`,
                            animationDuration: "1s",
                            animationIterationCount: "infinite",
                            transformOrigin: "bottom", // critical for bottom growth
                          }}
                        />
                      ))}
                    </div>
                  )}
                </span>

                {/* Full Server Name */}
                <span className="text-[10px] text-center truncate w-full">
                  {getServerName(player.guildId)}
                </span>

                {/* Animated Bars if Playing */}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4 flex flex-col border-t border-stone-800 pt-4 absolute bottom-0 w-full">
        <div className="flex flex-col gap-2 text-sm text-gray-400">
          {stats.map((item, index) => (
            <div key={index} className="flex items-center gap-4 justify-center">
              <div>{item.icon}</div>
              <div className={item.className || ""}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
