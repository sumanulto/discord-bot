import { Music, Settings, Play, Globe, Info } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">KMMusic Bot</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">A powerful music bot with web dashboard control</p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Globe className="mr-2 h-5 w-5" />
              Open Dashboard
            </button>
          </Link>
        </div>
      </div>

      <div className="flex items-center p-4 mb-4 text-sm text-blue-800 border border-blue-300 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800">
        <Info className="flex-shrink-0 inline w-4 h-4 mr-3" />
        <span>
          Make sure to start the Discord bot using{" "}
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">npm run bot</code> before using the
          dashboard.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Music className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Music Playback</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  High-quality music streaming with Lavalink
                </p>
              </div>
            </div>
            <div className="mt-4">
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• YouTube and Spotify support</li>
                <li>• Queue management</li>
                <li>• Volume control</li>
                <li>• Skip, pause, resume</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Play className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Slash Commands</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Easy-to-use Discord slash commands</p>
              </div>
            </div>
            <div className="mt-4">
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>
                  • <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">/play [song]</code> - Play music
                </li>
                <li>
                  • <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">/pause</code> - Pause playback
                </li>
                <li>
                  • <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">/skip</code> - Skip current song
                </li>
                <li>
                  • <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">/queue</code> - Show queue
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Web Dashboard</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Control your bot from anywhere</p>
              </div>
            </div>
            <div className="mt-4">
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Real-time status monitoring</li>
                <li>• Remote music control</li>
                <li>• Queue management</li>
                <li>• Multi-server support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Setup Instructions</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Follow these steps to get your Discord music bot running
          </p>
          <div className="mt-6 space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
                  1
                </span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Install Dependencies</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Run <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">npm install</code> to install
                  all required packages
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
                  2
                </span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Setup Lavalink</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Download and run Lavalink server on port 2333
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
                  3
                </span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Configure Environment</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Copy <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">.env.example</code> to{" "}
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">.env</code> and fill in your
                  Discord bot token
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
                  4
                </span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Start the Bot</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Run <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">npm run bot</code> to start the
                  Discord bot
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
                  5
                </span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Start the Dashboard</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Run <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">npm run dev</code> to start the
                  web dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
