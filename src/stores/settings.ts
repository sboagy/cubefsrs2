import { createStore } from "solid-js/store";
import { safeGet, safeSet } from "@/services/persistence/localStorage";

type SettingsState = {
	dark: boolean;
	backview: boolean;
	showCaseName: boolean;
	gyroAnimation: boolean;
	controlPanel: boolean;
	allowDrag: boolean;
	mirrorStickers: boolean;
	flashingIndicator: boolean;
	visualization: "PG3D" | "3D" | "2D";
};

const [settings, setSettings] = createStore<SettingsState>({
	dark: safeGet("cubedex.ui.dark", false),
	backview: safeGet("cubedex.ui.backview", false),
	showCaseName: safeGet("cubedex.ui.showCaseName", true),
	gyroAnimation: safeGet("cubedex.ui.gyroAnimation", false),
	controlPanel: safeGet("cubedex.ui.controlPanel", false),
	allowDrag: safeGet("cubedex.ui.allowDrag", true),
	mirrorStickers: safeGet("cubedex.ui.mirrorStickers", true),
	flashingIndicator: safeGet("cubedex.ui.flashingIndicator", false),
	visualization: safeGet("cubedex.ui.visualization", "PG3D"),
});

export { settings };

export function toggleDark() {
	const next = !settings.dark;
	setSettings("dark", next);
	safeSet("cubedex.ui.dark", next);
}
export function setDark(v: boolean) {
	setSettings("dark", v);
	safeSet("cubedex.ui.dark", v);
}
export function setBackview(v: boolean) {
	setSettings("backview", v);
	safeSet("cubedex.ui.backview", v);
}
export function setShowCaseName(v: boolean) {
	setSettings("showCaseName", v);
	safeSet("cubedex.ui.showCaseName", v);
}
export function setGyroAnimation(v: boolean) {
	setSettings("gyroAnimation", v);
	safeSet("cubedex.ui.gyroAnimation", v);
}
export function setControlPanel(v: boolean) {
	setSettings("controlPanel", v);
	safeSet("cubedex.ui.controlPanel", v);
}
export function setAllowDrag(v: boolean) {
	setSettings("allowDrag", v);
	safeSet("cubedex.ui.allowDrag", v);
}
export function setMirrorStickers(v: boolean) {
	setSettings("mirrorStickers", v);
	safeSet("cubedex.ui.mirrorStickers", v);
}
export function setFlashingIndicator(v: boolean) {
	setSettings("flashingIndicator", v);
	safeSet("cubedex.ui.flashingIndicator", v);
}
export function setVisualization(v: SettingsState["visualization"]) {
	setSettings("visualization", v);
	safeSet("cubedex.ui.visualization", v);
}
