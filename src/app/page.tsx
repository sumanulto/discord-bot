import { Music, Settings, Play, Globe, Info } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#181c20] py-10 px-2 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow">KMMusic Bot</h1>
          <p className="text-xl text-neutral-300">A powerful music bot with web dashboard control</p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <button className="inline-flex items-center px-5 py-2.5 border border-blue-700 text-base font-semibold rounded-lg shadow text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Globe className="mr-2 h-5 w-5" />
                Open Dashboard
              </button>
            </Link>
          </div>
        </div>

        <div className="flex items-center p-4 mb-4 text-sm border border-blue-900 rounded-lg bg-[#1a2233] text-blue-200">
          <Info className="flex-shrink-0 inline w-4 h-4 mr-3" />
          <span>
            Make sure to start the Discord bot using{' '}
            <code className="bg-blue-950 px-1 py-0.5 rounded">npm run bot</code> before using the dashboard.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#23272f] border border-[#23272f] shadow rounded-xl">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Music className="h-8 w-8 text-blue-400" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg leading-6 font-semibold text-white">Music Playback</h3>
                  <p className="mt-2 text-sm text-neutral-400">
                    High-quality music streaming with Lavalink
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li>• YouTube and Spotify support</li>
                  <li>• Queue management</li>
                  <li>• Volume control</li>
                  <li>• Skip, pause, resume</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#23272f] border border-[#23272f] shadow rounded-xl">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Play className="h-8 w-8 text-green-400" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg leading-6 font-semibold text-white">Slash Commands</h3>
                  <p className="mt-2 text-sm text-neutral-400">Easy-to-use Discord slash commands</p>
                </div>
              </div>
              <div className="mt-4">
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li>
                    • <code className="bg-[#23272f] px-1 py-0.5 rounded border border-neutral-700">/play [song]</code> - Play music
                  </li>
                  <li>
                    • <code className="bg-[#23272f] px-1 py-0.5 rounded border border-neutral-700">/pause</code> - Pause playback
                  </li>
                  <li>
                    • <code className="bg-[#23272f] px-1 py-0.5 rounded border border-neutral-700">/skip</code> - Skip current song
                  </li>
                  <li>
                    • <code className="bg-[#23272f] px-1 py-0.5 rounded border border-neutral-700">/queue</code> - Show queue
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#23272f] border border-[#23272f] shadow rounded-xl">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Settings className="h-8 w-8 text-purple-400" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg leading-6 font-semibold text-white">Web Dashboard</h3>
                  <p className="mt-2 text-sm text-neutral-400">Control your bot from anywhere</p>
                </div>
              </div>
              <div className="mt-4">
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li>• Real-time status monitoring</li>
                  <li>• Remote music control</li>
                  <li>• Queue management</li>
                  <li>• Multi-server support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#23272f] border border-[#23272f] shadow rounded-xl">
          <div className="px-6 py-6">
            <h3 className="text-lg leading-6 font-semibold text-white">Setup Instructions</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Follow these steps to get your Discord music bot running
            </p>
            <div className="mt-6 space-y-6">
              {["Install Dependencies", "Setup Lavalink", "Configure Environment", "Start the Bot", "Start the Dashboard"].map((step, i) => (
                <div className="flex items-start" key={step}>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-950 text-blue-200 text-xs font-medium">
                      {i + 1}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-white">{step}</h4>
                    <p className="text-sm text-neutral-400">
                      {i === 0 && <>Run <code className="bg-[#23272f] px-1 py-0.5 rounded border border-neutral-700">npm install</code> to install all required packages</>}
                      {i === 1 && <>Download and run Lavalink server on port 2333</>}
                      {i === 2 && <>
                        Copy <code className="bg-[#23272f] px-1 py-0.5 rounded border border-neutral-700">.env.example</code> to{' '}
                        <code className="bg-[#23272f] px-1 py-0.5 rounded border border-neutral-700">.env</code> and fill in your Discord bot token
                      </>}
                      {i === 3 && <>Run <code className="bg-[#23272f] px-1 py-0.5 rounded border border-neutral-700">npm run bot</code> to start the Discord bot</>}
                      {i === 4 && <>Run <code className="bg-[#23272f] px-1 py-0.5 rounded border border-neutral-700">npm run dev</code> to start the web dashboard</>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
