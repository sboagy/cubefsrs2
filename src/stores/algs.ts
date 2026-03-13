import { createStore } from "solid-js/store";
import type { AlgCatalog, AlgCase, AlgCategory } from "@/types/algs";
import defaults from "@/data/defaultAlgs.json";
import { safeGet, safeSet } from "@/services/persistence/localStorage";

const STORAGE_KEY = "cubedex.algs.catalog.v1";
const SELECTED_KEY = "cubedex.algs.selected.v1";
const CATEGORY_KEY = "cubedex.algs.category.v1";
const OPTIONS_KEY = "cubedex.algs.options.v1";
const CASES_KEY = "cubedex.algs.cases.v1";

type LibraryOptions = {
	randomAUF: boolean;
	randomOrder: boolean;
	slowFirst: boolean;
	prioritizeFailed: boolean;
};

type AlgsState = {
	catalog: AlgCatalog;
	cases: Record<string, AlgCase>;
	selectedIds: string[];
	currentCategory: string;
	options: LibraryOptions;
};

function loadFromStorage(): AlgCatalog | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as AlgCatalog) : null;
	} catch {
		return null;
	}
}

function saveToStorage(catalog: AlgCatalog) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
	} catch {}
}

function loadCasesFromStorage(): Record<string, AlgCase> {
	return safeGet<Record<string, AlgCase>>(CASES_KEY, {});
}
function saveCasesToStorage(cases: Record<string, AlgCase>) {
	safeSet(CASES_KEY, cases);
}

const [algs, setAlgs] = createStore<AlgsState>({
	catalog: { categories: [] },
	cases: {},
	selectedIds: safeGet<string[]>(SELECTED_KEY, []),
	currentCategory: safeGet<string>(CATEGORY_KEY, ""),
	options: safeGet<LibraryOptions>(OPTIONS_KEY, {
		randomAUF: false,
		randomOrder: false,
		slowFirst: false,
		prioritizeFailed: false,
	}),
});

export { algs };

// Derived helpers (computed equivalents)
export function allCategories() {
	return algs.catalog.categories;
}
export function currentCategoryObj(): AlgCategory | undefined {
	return algs.catalog.categories.find((c) => c.name === algs.currentCategory);
}
export function currentSubsets() {
	return currentCategoryObj()?.subsets ?? [];
}
export function isSelected(id: string) {
	return algs.selectedIds.includes(id);
}

export function buildCatalogFromDefaults(): {
	catalog: AlgCatalog;
	cases: Record<string, AlgCase>;
} {
	type DefaultsAlg = {
		name?: string;
		algorithm?: string;
		recognition?: string;
		mnemonic?: string;
		notes?: string;
	};
	type DefaultsSubset = { subset?: string; algorithms?: DefaultsAlg[] };
	type DefaultsRoot = Record<string, DefaultsSubset[]>;
	const data = defaults as unknown as DefaultsRoot;
	const categories: AlgCategory[] = [];
	const cases: Record<string, AlgCase> = {};
	for (const catName of Object.keys(data)) {
		const subsetsSrc: DefaultsSubset[] = Array.isArray(data[catName]) ? data[catName] : [];
		const subsets: { name: string; caseIds: string[] }[] = [];
		for (const subset of subsetsSrc) {
			const sName: string = subset?.subset ?? "";
			if (!sName) continue;
			const algsArr: DefaultsAlg[] = Array.isArray(subset?.algorithms)
				? (subset.algorithms as DefaultsAlg[])
				: [];
			const caseIds: string[] = [];
			for (const a of algsArr) {
				const id: string = String(a?.name ?? "").trim();
				if (!id) continue;
				caseIds.push(id);
				if (!cases[id]) {
					cases[id] = {
						id,
						name: id,
						alg: typeof a?.algorithm === "string" ? a.algorithm : "",
						recognition: typeof a?.recognition === "string" ? a.recognition : undefined,
						mnemonic: typeof a?.mnemonic === "string" ? a.mnemonic : undefined,
						notes: typeof a?.notes === "string" ? a.notes : undefined,
					} as AlgCase;
				}
			}
			subsets.push({ name: sName, caseIds });
		}
		categories.push({ name: catName, subsets });
	}
	return { catalog: { categories }, cases };
}

export function initAlgs() {
	const { catalog, cases } = buildCatalogFromDefaults();
	const stored = loadFromStorage();
	const storedCases = loadCasesFromStorage();
	const merged: Record<string, AlgCase> = { ...cases };
	for (const id of Object.keys(storedCases)) {
		if (merged[id]) merged[id] = { ...merged[id], ...storedCases[id] };
		else merged[id] = storedCases[id];
	}
	setAlgs("catalog", stored ?? catalog);
	setAlgs("cases", merged);
	if (!algs.currentCategory && algs.catalog.categories.length > 0) {
		setAlgs("currentCategory", algs.catalog.categories[0]?.name ?? "");
	}
}

export function setCategory(name: string) {
	setAlgs("currentCategory", name);
	safeSet(CATEGORY_KEY, name);
}

export function setOptions(opts: Partial<LibraryOptions>) {
	setAlgs("options", { ...algs.options, ...opts });
	safeSet(OPTIONS_KEY, algs.options);
}

export function toggleCase(id: string) {
	const idx = algs.selectedIds.indexOf(id);
	if (idx >= 0) {
		setAlgs("selectedIds", algs.selectedIds.filter((x) => x !== id));
	} else {
		setAlgs("selectedIds", [...algs.selectedIds, id]);
	}
	safeSet(SELECTED_KEY, algs.selectedIds);
}

export function selectSubset(name: string) {
	const cat = currentCategoryObj();
	const subset = cat?.subsets.find((s) => s.name === name);
	if (!subset) return;
	const toAdd = subset.caseIds.filter((id) => !algs.selectedIds.includes(id));
	setAlgs("selectedIds", [...algs.selectedIds, ...toAdd]);
	safeSet(SELECTED_KEY, algs.selectedIds);
}

export function deselectSubset(name: string) {
	const cat = currentCategoryObj();
	const subset = cat?.subsets.find((s) => s.name === name);
	if (!subset) return;
	const remove = new Set(subset.caseIds);
	setAlgs("selectedIds", algs.selectedIds.filter((id) => !remove.has(id)));
	safeSet(SELECTED_KEY, algs.selectedIds);
}

export function createCase(
	category: string,
	subsetName: string,
	id: string,
	payload: Partial<AlgCase>,
) {
	const cats = algs.catalog.categories.map((c) => ({ ...c, subsets: [...c.subsets] }));
	let cat = cats.find((c) => c.name === category);
	if (!cat) {
		cat = { name: category, subsets: [] };
		cats.push(cat);
	}
	let subset = cat.subsets.find((s) => s.name === subsetName);
	if (!subset) {
		subset = { name: subsetName, caseIds: [] };
		cat.subsets.push(subset);
	}
	if (!subset.caseIds.includes(id)) subset.caseIds.push(id);
	const base: AlgCase = { id, name: payload.name || id, alg: payload.alg || "" };
	const newCases = { ...algs.cases, [id]: { ...base, ...payload } as AlgCase };
	setAlgs("catalog", { categories: cats });
	setAlgs("cases", newCases);
	saveToStorage({ categories: cats });
	saveCasesToStorage(newCases);
}

export function updateCase(id: string, patch: Partial<AlgCase>) {
	const existing = algs.cases[id] ?? { id, name: id, alg: "" };
	const next = { ...existing, ...patch } as AlgCase;
	const newCases = { ...algs.cases, [id]: next };
	setAlgs("cases", newCases);
	saveCasesToStorage(newCases);
}

export function deleteCase(id: string) {
	const newCases = { ...algs.cases };
	delete newCases[id];
	const cats = algs.catalog.categories.map((c) => ({
		...c,
		subsets: c.subsets.map((s) => ({ ...s, caseIds: s.caseIds.filter((cid) => cid !== id) })),
	}));
	setAlgs("cases", newCases);
	setAlgs("catalog", { categories: cats });
	setAlgs("selectedIds", algs.selectedIds.filter((sid) => sid !== id));
	saveToStorage({ categories: cats });
	saveCasesToStorage(newCases);
	safeSet(SELECTED_KEY, algs.selectedIds);
}

export function resetToDefaults() {
	const { catalog, cases } = buildCatalogFromDefaults();
	const storedCases = loadCasesFromStorage();
	const merged: Record<string, AlgCase> = { ...cases };
	for (const id of Object.keys(storedCases)) {
		if (merged[id]) merged[id] = { ...merged[id], ...storedCases[id] };
	}
	setAlgs("catalog", catalog);
	setAlgs("cases", merged);
	saveToStorage(catalog);
	saveCasesToStorage(merged);
	if (!algs.currentCategory && catalog.categories.length) {
		setAlgs("currentCategory", catalog.categories[0]?.name ?? "");
	}
}

export function updateFromDefaults() {
	const base = algs.catalog;
	const { catalog: defCatalog, cases: defCases } = buildCatalogFromDefaults();
	const byName = new Map<string, AlgCategory>();
	for (const c of base.categories) byName.set(c.name, { ...c, subsets: [...c.subsets] });
	for (const c of defCatalog.categories) {
		const existing = byName.get(c.name);
		if (!existing) {
			byName.set(c.name, { name: c.name, subsets: [...c.subsets] });
		} else {
			const subsetNames = new Set(existing.subsets.map((s) => s.name));
			for (const s of c.subsets) {
				if (!subsetNames.has(s.name)) existing.subsets.push({ ...s });
				else {
					const target = existing.subsets.find((x) => x.name === s.name);
					if (target) {
						const existingIds = new Set(target.caseIds);
						for (const id of s.caseIds) if (!existingIds.has(id)) target.caseIds.push(id);
					}
				}
			}
		}
	}
	const newCatalog = { categories: Array.from(byName.values()) };
	const minCases: Record<string, AlgCase> = { ...defCases };
	for (const cat of newCatalog.categories) {
		for (const subset of cat.subsets) {
			for (const id of subset.caseIds) {
				if (!(id in minCases)) minCases[id] = { id, name: id, alg: "" };
			}
		}
	}
	const storedCases = loadCasesFromStorage();
	for (const id of Object.keys(storedCases)) {
		if (minCases[id]) minCases[id] = { ...minCases[id], ...storedCases[id] };
	}
	setAlgs("catalog", newCatalog);
	setAlgs("cases", minCases);
	saveToStorage(newCatalog);
	saveCasesToStorage(minCases);
}

export function importFromJson(json: string) {
	const parsed = JSON.parse(json) as AlgCatalog;
	if (!parsed || !Array.isArray(parsed.categories)) throw new Error("Invalid catalog JSON");
	const cases: Record<string, AlgCase> = {};
	for (const cat of parsed.categories) {
		for (const subset of cat.subsets) {
			for (const id of subset.caseIds) {
				if (!(id in cases)) cases[id] = { id, name: id, alg: "" };
			}
		}
	}
	const storedCases = loadCasesFromStorage();
	for (const id of Object.keys(storedCases)) {
		if (cases[id]) cases[id] = { ...cases[id], ...storedCases[id] };
	}
	setAlgs("catalog", parsed);
	setAlgs("cases", cases);
	saveToStorage(parsed);
	saveCasesToStorage(cases);
}

export function exportToJson(): string {
	return JSON.stringify(algs.catalog, null, 2);
}
