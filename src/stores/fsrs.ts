import { createStore } from "solid-js/store";
import type { FSRSState, Rating } from "@/services/scheduler/fsrs";
import {
	getFsrsConfig,
	reconfigureFsrs,
	createInitialState,
	pickNextDue,
	review as fsrsReview,
	type FsrsUserParams,
} from "@/services/scheduler/fsrs";
import { safeGet, safeSet } from "@/services/persistence/localStorage";

const STORAGE_KEY = "cubedex.fsrs.states.v1";

type FsrsState = {
	params: FsrsUserParams;
	states: Record<string, FSRSState>;
	queue: string[];
};

const [fsrs, setFsrs] = createStore<FsrsState>({
	params: {} as FsrsUserParams,
	states: {},
	queue: [],
});

export { fsrs };

export function initFsrs() {
	setFsrs("params", getFsrsConfig());
	setFsrs("states", safeGet<Record<string, FSRSState>>(STORAGE_KEY, {}));
	refreshQueue();
}

function saveFsrs() {
	safeSet(STORAGE_KEY, fsrs.states);
}

export function applyParams(p: Partial<FsrsUserParams>) {
	reconfigureFsrs(p);
	setFsrs("params", getFsrsConfig());
}

export function clearReviews() {
	setFsrs("states", {});
	setFsrs("queue", []);
	saveFsrs();
}

export function ensureCard(id: string) {
	if (!fsrs.states[id]) {
		setFsrs("states", { ...fsrs.states, [id]: createInitialState(Date.now()) });
		saveFsrs();
	}
}

export function refreshQueue() {
	const now = Date.now();
	const ids = Object.keys(fsrs.states);
	const due: string[] = [];
	for (const id of ids) {
		const s = fsrs.states[id];
		if (s && s.due <= now) due.push(id);
	}
	if (!due.length) {
		const next = pickNextDue(fsrs.states, now);
		setFsrs("queue", next ? [next] : []);
	} else {
		setFsrs("queue", due);
	}
}

export function popNext(): string | null {
	if (!fsrs.queue.length) return null;
	const [first, ...rest] = fsrs.queue;
	setFsrs("queue", rest);
	return first ?? null;
}

export function reviewCase(id: string, rating: Rating) {
	ensureCard(id);
	const prev = fsrs.states[id]!;
	const now = Date.now();
	const res = fsrsReview(prev, rating, now);
	setFsrs("states", { ...fsrs.states, [id]: res.state });
	saveFsrs();
	refreshQueue();
	return res;
}
