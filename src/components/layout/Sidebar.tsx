import { A } from "@solidjs/router";
import { device, connectDevice, disconnectDevice } from "@/stores/device";
import AuthPanel from "@/components/auth/AuthPanel";

export default function Sidebar() {
  async function toggleConnect() {
    if (device.connected) await disconnectDevice();
    else await connectDevice();
  }

  return (
    <div class="h-full p-4 space-y-4">
      <div class="text-lg font-semibold">CubeFSRS</div>
      <nav class="flex flex-col gap-1">
        <A class="btn" href="/" end>
          Practice
        </A>
        <A class="btn" href="/new">
          New Alg
        </A>
        <A class="btn" href="/library">
          Alg Library
        </A>
        <A class="btn" href="/options">
          Options
        </A>
        <A class="btn" href="/help">
          Help
        </A>
        <A class="btn" href="/build">
          Build
        </A>
      </nav>
      <div class="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <button
          class="w-full px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={device.connecting}
          onClick={toggleConnect}
        >
          {device.connected
            ? "Disconnect"
            : device.connecting
              ? "Connecting…"
              : "Connect"}
        </button>
        <div class="text-sm text-gray-500">
          Device:{" "}
          <span class={device.connected ? "text-green-600" : "opacity-80"}>
            {device.connected ? device.info.name || "connected" : "not connected"}
          </span>
          {device.info.battery != null && <span> · {device.info.battery}%</span>}
        </div>
      </div>
      <div class="pt-2 border-t border-gray-200 dark:border-gray-800">
        <AuthPanel />
      </div>
    </div>
  );
}
