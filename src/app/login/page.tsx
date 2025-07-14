"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Incorrect password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030202] text-white">
      <form onSubmit={handleSubmit} className="bg-neutral-900 p-8 rounded shadow-lg flex flex-col gap-4 w-80">
        <h2 className="text-2xl font-bold mb-2 text-center">Dashboard Login</h2>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="p-2 rounded bg-neutral-800 border border-neutral-700 text-white"
        />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
}
