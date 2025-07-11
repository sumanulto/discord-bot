import { Music, MoreVertical } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function QueueSection({
  currentPlayer,
  searchQuery,
  setSearchQuery,
  controlPlayer,
  formatTime,
  handleRemoveTrack,
  handlePlayNext,
}: any) {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [isQueueActive, setQueueActive] = useState("Queue");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (isQueueActive === "Search" && searchQuery.trim()) {
      fetch(
        `/api/youtube-search?query=${encodeURIComponent(searchQuery.trim())}`
      )
        .then((res) => res.json())
        .then((data) => setSearchResults(data))
        .catch((err) => console.error("Search error:", err));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, isQueueActive]);

  return (
    <div className="p-4 w-96 flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center w-full mb-4">
        <button
          className={`w-1/2 text-base pb-4 text-center font-light uppercase border-b-2 ${
            isQueueActive === "Queue"
              ? "border-neutral-300 text-neutral-200"
              : "border-neutral-700 text-neutral-500"
          }`}
          onClick={() => setQueueActive("Queue")}
        >
          Queue ({currentPlayer?.queue.length || 0})
        </button>
        <button
          className={`w-1/2 text-base pb-4 text-center font-light uppercase border-b-2 ${
            isQueueActive === "Search"
              ? "border-neutral-300 text-neutral-200"
              : "border-neutral-700 text-neutral-500"
          }`}
          onClick={() => setQueueActive("Search")}
        >
          Search
        </button>
      </div>

      {/* Content wrapper with scroll */}
      <div className="flex-1 px-1">
        {isQueueActive === "Search" ? (
          <div className="flex flex-col h-full px-1">
            {/* Sticky Search Bar */}
            <div className="sticky top-0 z-10 bg-[#030202] pb-2">
              <input
                type="text"
                placeholder="🔍 Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-stone-300"
              />
            </div>

            {/* Scrollable results container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[450px]">
              {searchResults.map((track: any, index: number) => (
                <div
                  key={index}
                  className="relative group flex items-center space-x-3 p-2 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  onClick={() =>
                    controlPlayer(
                      "play",
                      `https://www.youtube.com/watch?v=${track.id}`
                    )
                  }
                >
                  <div className="w-14 h-10 relative rounded overflow-hidden flex items-center justify-center">
                    <img
                      src={track.thumbnail || "/placeholder.svg"}
                      alt={track.title}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {track.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {track.channelTitle || "YouTube"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {currentPlayer?.queue.length > 0 ? (
              <div className="space-y-2">
                {currentPlayer.queue.map((track: any, index: number) => {
                  const thumbnail =
                    track.thumbnail && track.thumbnail.startsWith("http")
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

                      {/* 3-dot menu */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuIndex(
                              openMenuIndex === index ? null : index
                            )
                          }
                          className="p-1 hover:bg-neutral-950 rounded-full"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>

                        {openMenuIndex === index && (
                          <div className="absolute right-0 top-8 z-20 bg-black border border-gray-700 rounded shadow-lg text-sm">
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
          </>
        )}
      </div>
    </div>
  );
}
