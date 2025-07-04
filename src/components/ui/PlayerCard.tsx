"use client";

import type React from "react";
import { useState, useRef } from "react"; // Import useRef
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
  Search,
  MoreHorizontal,
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
  seekToPosition: (percentage: number) => void;
  setIsSeekingTimeline: (seeking: boolean) => void;
  selectedGuild: string;
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
  fetchPlayers,
}: PlayerCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Ref to store the timeout ID for hiding the volume slider
  const hideVolumeSliderTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleRemoveTrack = async (index: number) => {
    if (!selectedGuild) return;

    try {
      const response = await fetch("/api/bot/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          guildId: selectedGuild,
          index,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(data.error || "Failed to remove track");
      } else {
        fetchPlayers();
      }
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
        body: JSON.stringify({
          action: "playNext",
          guildId: selectedGuild,
          index,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(data.error || "Failed to move track");
      } else {
        fetchPlayers();
      }
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

  // Function to show the volume slider and clear any pending hide timeouts
  const showSlider = () => {
    if (hideVolumeSliderTimeout.current) {
      clearTimeout(hideVolumeSliderTimeout.current);
    }
    setShowVolumeSlider(true);
  };

  // Function to hide the volume slider after a short delay
  const hideSlider = () => {
    hideVolumeSliderTimeout.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 200); // 200ms delay to allow cursor to move onto the slider
  };

  if (!currentPlayer.current) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] w-full text-white ">
      {/* Top: Player Image + Queue/Search Section */}
      <div className="flex flex-1 overflow-hidden justify-between ">
        {/* Album Art */}
        <div className="flex items-center w-full justify-center p-4 min-w-[300px]">
          <Image
            src={currentPlayer.current.thumbnail || "/placeholder.svg"}
            alt="Album Art"
            width={300}
            height={300}
            className="rounded-xl shadow-2xl object-cover w-full h-auto max-h-[85vh]"
          />
        </div>

        {/* QueueSection (now enhanced to include tabs and search) */}
        <div className="items-end pr-4">
          <QueueSection
            currentPlayer={currentPlayer}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            controlPlayer={controlPlayer}
            formatTime={formatTime}
            handleRemoveTrack={handleRemoveTrack}
            handlePlayNext={handlePlayNext}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleSearch={handleSearch}
            isSearching={isSearching}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
          />
        </div>
      </div>

      {/* Bottom: Control Panel */}
      <div className="border-t border-neutral-800 px-4 py-2">
        <div className="items-center space-x-3 w-full px-2">
          {/* Track Info */}
          <div>
            <h1 className="text-base font-bold">
              {currentPlayer.current.title}
            </h1>
            <p className="text-sm text-gray-300">
              {currentPlayer.current.author}
            </p>
          </div>
          {/* Timeline */}
          <input
            type="range"
            min="0"
            max="100"
            value={
              (currentPlayer.position / currentPlayer.current.duration) * 100
            }
            onChange={(e) => {
              setIsSeekingTimeline(true);
              seekToPosition(Number(e.target.value));
              setTimeout(() => setIsSeekingTimeline(false), 1000);
            }}
            className="w-full h-1 bg-gray-700 appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
                (currentPlayer.position / currentPlayer.current.duration) * 100
              }%, #374151 ${
                (currentPlayer.position / currentPlayer.current.duration) * 100
              }%, #374151 100%)`,
            }}
          />
          <div className="flex items-center p-2 justify-between w-full">
            <span className="text-sm text-gray-400 text-right">
              {formatTime(currentPlayer.position)}
            </span>
            <span className="text-sm text-gray-400 text-left">
              {formatTime(currentPlayer.current.duration)}
            </span>
          </div>
        </div>
        <div className="w-full flex mx-auto space-y-4">
          <div className=" flex items-center w-full space-x-2 justify-between px-4 ">
            {/* Left Action Buttons */}
            <div className="flex items-center justify-center space-x-2">
              <Heart />
              <Download />
            </div>

            {/* Main Playback Controls */}
            <div className="flex justify-center items-center space-x-4 ">
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
                  controlPlayer(currentPlayer.paused ? "play" : "pause")
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
            {/* Right Side Volume Control & MicVocal */}
            <div className="flex items-center space-x-2">
              <MicVocal className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />

              {/* Volume control with hover - DELAYED HIDE FIX */}
              <div
                className="relative flex items-center"
                onMouseEnter={showSlider} // Use showSlider function
                onMouseLeave={hideSlider} // Use hideSlider function
              >
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
                {/* Conditionally rendered volume slider and value */}
                {showVolumeSlider && (
                  <div className="absolute right-0 bottom-full mb-2 bg-neutral-800 p-3 rounded-lg shadow-lg flex items-center space-x-2 z-10">
                    <input
                      type="range"
                      min="0"
                      max="100"
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
      {/* Click outside to close dropdown (if QueueSection doesn't handle it with portals) */}
      {dropdownOpen !== null && (
        <div className="fixed inset-0 z-5" onClick={() => setDropdownOpen(null)} />
      )}
    </div>
  );
}