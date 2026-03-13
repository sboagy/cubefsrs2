import { createEffect } from "solid-js";
import { settings } from "@/stores/settings";

export function initTheme() {
	createEffect(() => {
		const el = document.documentElement;
		if (settings.dark) {
			el.classList.add("dark");
		} else {
			el.classList.remove("dark");
		}
	});
}
