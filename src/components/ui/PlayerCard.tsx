"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Play,
  Music,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  Download,
  MicVocal,
} from "lucide-react";

import QueueSection from "./QueueSection";

interface PlayerCardProps {
  currentPlayer: any;
  controlPlayer: (action: string, query?: string) => void;
  formatTime: (ms: number) => string;
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  loading: boolean;
  seekToPosition: (percentage: number, positionMs: number) => void;
  setIsSeekingTimeline: (seeking: boolean) => void;
  selectedGuild: string;
  isSeekingTimeline: boolean;
  fetchPlayers: () => void;
}

export default function PlayerCard({
  currentPlayer,
  controlPlayer,
  formatTime,
  isMuted,
  toggleMute,
  volume,
  setVolume,
  loading,
  seekToPosition,
  setIsSeekingTimeline,
  selectedGuild,
  isSeekingTimeline,
  fetchPlayers,
}: PlayerCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  // New state for shuffle and repeat modes
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");

  const localProgressInterval = useRef<NodeJS.Timeout | null>(null);
  const hideVolumeSliderTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize shuffle/repeat from playerSettings or fetch on mount
  useEffect(() => {
    // You might want to fetch these settings from your backend or context
    // For example, from currentPlayer or an API call:
    // Assuming currentPlayer.settings.shuffleEnabled and repeatMode are available:
    if (currentPlayer.settings) {
      setShuffleEnabled(currentPlayer.settings.shuffleEnabled ?? false);
      setRepeatMode(currentPlayer.settings.repeatMode ?? "off");
    }
  }, [currentPlayer]);

  const toggleShuffle = async () => {
    try {
      const enabled = !shuffleEnabled;
      const response = await fetch("/api/bot/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "shuffle", guildId: selectedGuild, enabled }),
      });
      const data = await response.json();
      if (response.ok) {
        setShuffleEnabled(enabled);
        fetchPlayers();
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRepeat = async () => {
    try {
      let newMode: "off" | "one" | "all" = "off";
      if (repeatMode === "off") newMode = "all";
      else if (repeatMode === "all") newMode = "one";
      else if (repeatMode === "one") newMode = "off";

      const response = await fetch("/api/bot/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "repeat", guildId: selectedGuild, mode: newMode }),
      });
      const data = await response.json();
      if (response.ok) {
        setRepeatMode(newMode);
        fetchPlayers();
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTrack = async (index: number) => {
    if (!selectedGuild) return;
    try {
      const response = await fetch("/api/bot/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", guildId: selectedGuild, index }),
      });
      const data = await response.json();
      if (!response.ok) console.error(data.error || "Failed to remove track");
      else fetchPlayers();
    } catch (err) {
      console.error("Failed to remove track:", err);
    } finally {
      setDropdownOpen(null);
    }
  };

  const handlePlayNext = async (index: number) => {
    if (!selectedGuild) return;
    try {
      const response = await fetch("/api/bot/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "playNext", guildId: selectedGuild, index }),
      });
      const data = await response.json();
      if (!response.ok) console.error(data.error || "Failed to move track");
      else fetchPlayers();
    } catch (err) {
      console.error("Failed to move track:", err);
    } finally {
      setDropdownOpen(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      await controlPlayer("play", searchQuery);
      setSearchQuery("");
      setTimeout(fetchPlayers, 1000);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const showSlider = () => {
    if (hideVolumeSliderTimeout.current) clearTimeout(hideVolumeSliderTimeout.current);
    setShowVolumeSlider(true);
  };

  const hideSlider = () => {
    hideVolumeSliderTimeout.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 200);
  };

  const prevSelectedGuild = useRef<string | null>(null);

  useEffect(() => {
    if (selectedGuild !== prevSelectedGuild.current && currentPlayer.position !== undefined) {
      setLocalProgress(currentPlayer.position);
    } else { setLocalProgress(0); }
    prevSelectedGuild.current = selectedGuild;
  }, [currentPlayer.current?.uri, selectedGuild]);

  useEffect(() => {
    if (currentPlayer.current && !currentPlayer.paused && !isSeekingTimeline) {
      if (localProgressInterval.current) clearInterval(localProgressInterval.current);

      localProgressInterval.current = setInterval(() => {
        setLocalProgress((prev) => prev + 100);
      }, 100);

      const syncInterval = setInterval(() => {
        setLocalProgress(currentPlayer.position);
      }, 10000);

      return () => {
        if (localProgressInterval.current) clearInterval(localProgressInterval.current);
        clearInterval(syncInterval);
        localProgressInterval.current = null;
      };
    } else {
      if (localProgressInterval.current) {
        clearInterval(localProgressInterval.current);
        localProgressInterval.current = null;
      }
      setLocalProgress(currentPlayer.position);
    }
  }, [
    currentPlayer.current,
    currentPlayer.paused,
    currentPlayer.position,
    currentPlayer.current?.duration,
    isSeekingTimeline,
  ]);

  if (!currentPlayer.current) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Music className="h-24 w-24 mx-auto text-gray-600 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-300 mb-2">No music playing</h2>
          <p className="text-gray-500">Use Discord commands to start playing music</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] w-full text-white">
      <div className="flex flex-1 overflow-hidden justify-between">
        <div className="flex items-center w-full justify-center p-4 min-w-[300px]">
          <Image
            src={currentPlayer.current.thumbnail || "/placeholder.svg"}
            alt="Album Art"
            width={300}
            height={300}
            className="rounded-xl shadow-2xl object-cover w-full h-auto max-h-[85vh]"
          />
        </div>

        <div className="items-end pr-4">
          <QueueSection
            currentPlayer={currentPlayer}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            controlPlayer={controlPlayer}
            formatTime={formatTime}
            handleRemoveTrack={handleRemoveTrack}
            handlePlayNext={handlePlayNext}
            handleSearch={handleSearch}
            isSearching={isSearching}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
          />
        </div>
      </div>

      <div className="border-t border-neutral-800 px-4 py-2">
        <div className="items-center space-x-3 w-full px-2">
          <div>
            <h1 className="text-base font-bold">{currentPlayer.current.title}</h1>
            <p className="text-sm text-gray-300">{currentPlayer.current.author}</p>
          </div>

          <input
            type="range"
            min={0}
            max={currentPlayer.current.duration}
            value={localProgress}
            disabled={loading}
            onChange={(e) => {
              const newPositionMs = Number(e.target.value);
              setIsSeekingTimeline(true);
              setLocalProgress(newPositionMs); // Immediately reflect visually
              seekToPosition(
                (newPositionMs / currentPlayer.current.duration) * 100,
                newPositionMs
              );
              setTimeout(() => setIsSeekingTimeline(false), 1000);
            }}
            className="w-full h-1 bg-gray-700 appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
                (localProgress / currentPlayer.current.duration) * 100
              }%, #374151 ${(localProgress / currentPlayer.current.duration) * 100}%, #374151 100%)`,
            }}
          />

          <div className="flex items-center justify-between w-full text-xs text-gray-400 mt-1">
            <span>{formatTime(localProgress)}</span>
            <span>{formatTime(currentPlayer.current.duration)}</span>
          </div>
        </div>

        <div className="w-full flex mx-auto space-y-4">
          <div className="flex items-center w-full space-x-2 justify-between px-4">
            <div className="flex items-center justify-center space-x-2">
              <Heart />
              <Download />
            </div>

            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-full transition-colors ${
                  shuffleEnabled ? "bg-red-600 text-white" : "hover:bg-gray-800 text-gray-400"
                }`}
                title="Shuffle"
              >
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
              <button
                onClick={toggleRepeat}
                className={`p-2 rounded-full transition-colors ${
                  repeatMode !== "off" ? "bg-red-600 text-white" : "hover:bg-gray-800 text-gray-400"
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                <Repeat className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <MicVocal className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
              <div
                className="relative flex items-center"
                onMouseEnter={showSlider}
                onMouseLeave={hideSlider}
              >
                <button onClick={toggleMute} className="p-2 hover:bg-gray-800 rounded-full">
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                {showVolumeSlider && (
                  <div className="absolute right-0 bottom-full mb-2 bg-neutral-800 p-3 rounded-lg shadow-lg flex items-center space-x-2 z-10">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-32 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
                          isMuted ? 0 : volume
                        }%, #374151 ${isMuted ? 0 : volume}%, #374151 100%)`,
                      }}
                    />
                    <span className="text-sm text-gray-400 w-8 text-right">
                      {isMuted ? 0 : volume}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {dropdownOpen !== null && (
        <div className="fixed inset-0 z-5" onClick={() => setDropdownOpen(null)} />
      )}
    </div>
  );
}
