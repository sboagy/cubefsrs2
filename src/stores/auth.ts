import { createStore } from "solid-js/store";
import type { User } from "firebase/auth";

type AuthState = {
	user: User | null;
	syncing: boolean;
};

const [auth, setAuth] = createStore<AuthState>({
	user: null,
	syncing: false,
});

export { auth };

export function setUser(u: User | null) {
	setAuth("user", u);
}
export function setSyncing(v: boolean) {
	setAuth("syncing", v);
}
