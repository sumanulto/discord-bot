"use client";

import { Music, MoreVertical } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface QueueSectionProps {
  currentPlayer: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  controlPlayer: (action: string, query?: string) => void;
  formatTime: (ms: number) => string;
  handleRemoveTrack: (index: number) => void;
  handlePlayNext: (index: number) => void;
  handleSearch: () => void;
  isSearching: boolean;
  dropdownOpen: number | null;
  setDropdownOpen: (index: number | null) => void;
}

export default function QueueSection({
  currentPlayer,
  searchQuery,
  setSearchQuery,
  controlPlayer,
  formatTime,
  handleRemoveTrack,
  handlePlayNext,
  handleSearch,
  isSearching,
  dropdownOpen,
  setDropdownOpen,
}: QueueSectionProps) {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"Queue" | "Search">("Queue");

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      controlPlayer("play", searchQuery.trim());
      setSearchQuery("");
    }
  };

  return (
    <div className="p-4 w-96 flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center w-full mb-4">
        {["Queue", "Search"].map((tab) => (
          <button
            key={tab}
            className={`w-1/2 text-base pb-4 text-center font-light uppercase border-b-2 transition-colors ${
              activeTab === tab
                ? "border-neutral-300 text-neutral-200"
                : "border-neutral-700 text-neutral-500"
            }`}
            onClick={() => setActiveTab(tab as "Queue" | "Search")}
          >
            {tab}
            {tab === "Queue" && ` (${currentPlayer?.queue?.length || 0})`}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-neutral-950 rounded-lg px-1">
        {activeTab === "Search" ? (
          <div className="mb-4 sticky top-0 z-10 bg-neutral-950 py-2">
            <input
              type="text"
              placeholder="🔍 Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-300"
            />
          </div>
        ) : currentPlayer?.queue?.length > 0 ? (
          <div className="space-y-2">
            {currentPlayer.queue.map((track: any, index: number) => {
              const thumbnail =
                track.thumbnail?.startsWith("http")
                  ? track.thumbnail
                  : "/placeholder.svg";

              return (
                <div
                  key={index}
                  className="relative group flex items-center space-x-3 p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 relative rounded overflow-hidden">
                    <Image
                      src={thumbnail}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
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

                  {/* More menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuIndex(openMenuIndex === index ? null : index)
                      }
                      className="p-1 hover:bg-neutral-950 rounded-full"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>

                    {openMenuIndex === index && (
                      <div className="absolute right-0 top-8 z-20 bg-black border border-gray-700 rounded shadow-lg text-sm w-32">
                        <button
                          onClick={() => {
                            handlePlayNext(index);
                            setOpenMenuIndex(null);
                          }}
                          className="block w-full px-4 py-2 hover:bg-gray-800 text-white text-left"
                        >
                          Play Next
                        </button>
                        <button
                          onClick={() => {
                            handleRemoveTrack(index);
                            setOpenMenuIndex(null);
                          }}
                          className="block w-full px-4 py-2 hover:bg-gray-800 text-red-400 text-left"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Music className="h-12 w-12 mx-auto text-gray-600 mb-2" />
            <p className="text-gray-500 text-sm">Queue is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
