import { createStore } from "solid-js/store";
import type { DeviceState } from "@/types/device";
import {
	connectGanCube,
	disconnectGanCube,
	onGanEvents,
	type GanEvent,
} from "@/services/ganBluetooth";
import { safeGet, safeSet } from "@/services/persistence/localStorage";

const [device, setDevice] = createStore<DeviceState>({
	connected: false,
	connecting: false,
	info: {},
	quaternion: undefined,
	angularVelocity: undefined,
	lastMove: undefined,
	lastMoveAt: undefined,
	facelets: undefined,
	autoReconnect: safeGet("cubedex.device.autoReconnect", true),
});

export { device };

export async function connectDevice() {
	if (device.connected || device.connecting) return;
	setDevice("connecting", true);
	try {
		await connectGanCube();
		setDevice("connected", true);
		onGanEvents((ev: GanEvent) => {
			if (ev.type === "info") setDevice("info", { ...device.info, ...ev.info });
			else if (ev.type === "battery") setDevice("info", { ...device.info, battery: ev.battery });
			else if (ev.type === "move") {
				setDevice("lastMove", ev.move);
				setDevice("lastMoveAt", Date.now());
			} else if (ev.type === "facelets") setDevice("facelets", ev.facelets);
			else if (ev.type === "quaternion")
				setDevice("quaternion", ev.quaternion as DeviceState["quaternion"]);
			else if (ev.type === "angular")
				setDevice("angularVelocity", ev.w as DeviceState["angularVelocity"]);
			else if (ev.type === "disconnect") {
				setDevice("connected", false);
				setDevice("connecting", false);
				if (device.autoReconnect) {
					setTimeout(() => connectDevice().catch(() => {}), 1000);
				}
			}
		});
	} catch (e) {
		console.error("Connect failed", e);
		setDevice("connected", false);
	} finally {
		setDevice("connecting", false);
	}
}

export async function disconnectDevice() {
	await disconnectGanCube();
	setDevice("connected", false);
	setDevice("info", {});
	setDevice("quaternion", undefined);
	setDevice("angularVelocity", undefined);
	setDevice("lastMove", undefined);
	setDevice("facelets", undefined);
}

export function setAutoReconnect(v: boolean) {
	setDevice("autoReconnect", v);
	safeSet("cubedex.device.autoReconnect", v);
}
