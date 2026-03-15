import { AuthProvider } from "@rhizome/core";
import type { ParentComponent } from "solid-js";
import {
	needsCatalogSeed,
	seedCatalogFromDefaults,
} from "@/lib/db/catalog-seeder";
import { closeDb, getDb, initializeDb } from "@/lib/db/client-sqlite";
import { setCurrentUserId, setDbReady } from "@/lib/db/db-state";
import { migrateLocalStorageToSqlite } from "@/lib/db/localStorage-migration";
import {
	loadAlgsFromDb,
	loadFsrsFromDb,
	loadPracticeFromDb,
	loadUserSettingsFromDb,
} from "@/lib/db/store-loaders";
import { startSyncWorker } from "@/lib/sync";
import { getSupabaseClient } from "@/services/supabase";
import { algs } from "@/stores/algs";

// Holds the stop function returned by startSyncWorker; cleared on sign-out.
let stopSync: (() => void) | null = null;
// Tracks the user ID for the currently-running sync session so that a
// duplicate onSignIn call (getSession() races with onAuthStateChange) is
// detected and silently no-ops instead of creating a second SyncEngine.
let syncSessionUserId: string | null = null;

/**
 * App-level auth provider for CubeFSRS.
 *
 * Thin wrapper over rhizome's AuthProvider that wires up the SQLite DB
 * lifecycle on sign-in / sign-out.
 */
const CubeAuthProvider: ParentComponent = (props) => {
	const client = getSupabaseClient();

	if (!client) {
		// Supabase not configured — render without auth (offline / dev mode)
		return <>{props.children}</>;
	}

	return (
		<AuthProvider
			supabaseClient={client}
			onSignIn={async (user) => {
				// Guard against duplicate onSignIn calls for the same user.
				// Supabase fires both getSession() and onAuthStateChange(SIGNED_IN)
				// near-simultaneously on page load; the second call must be a no-op
				// to avoid creating an orphaned SyncEngine whose timers later run
				// against a closed sql.js database and produce "out of memory" errors.
				//
				// We check syncSessionUserId ONLY (not stopSync) because both calls
				// can arrive before startSyncWorker returns and sets stopSync. The
				// assignment below is synchronous and runs before the first await, so
				// any second concurrent call will see syncSessionUserId already set.
				if (syncSessionUserId === user.id) {
					return;
				}

				// Stop any previous sync session (different user or leftover timers).
				stopSync?.();
				stopSync = null;
				syncSessionUserId = user.id;

				try {
					// 1. Initialise per-user SQLite DB (runs migrations if needed)
					await initializeDb(user.id);
					setCurrentUserId(user.id);

					const db = getDb();
					if (!db) return;

					// 2. Seed global catalog if this is a first-run empty DB
					let nameToDbId = new Map<string, string>();
					if (await needsCatalogSeed(db)) {
						nameToDbId = await seedCatalogFromDefaults(db);
					}

					// 3. Load data from SQLite into the Solid stores
					await loadAlgsFromDb(db, user.id);
					await loadFsrsFromDb(db, user.id);
					await loadPracticeFromDb(db, user.id);
					await loadUserSettingsFromDb(db, user.id);

					// 4. If nameToDbId is empty (catalog was already seeded), build it from the
					//    in-memory cases that loadAlgsFromDb just populated.
					if (nameToDbId.size === 0) {
						for (const [name, c] of Object.entries(algs.cases)) {
							if (c.dbId) nameToDbId.set(name, c.dbId);
						}
					}

					// 5. One-time migration from legacy localStorage keys → SQLite
					await migrateLocalStorageToSqlite(db, user.id, nameToDbId);

					setDbReady(true);

					// 6. Start background sync between local SQLite and Supabase
					const supabase = getSupabaseClient();
					if (supabase) {
						const { stop } = startSyncWorker(db, {
							supabase,
							userId: user.id,
							syncIntervalMs: 5000,
							realtimeEnabled: false,
							onSyncComplete: (result) => {
								if (result.errors.length > 0) {
									console.warn(
										"[CubeAuthProvider] sync errors:",
										result.errors,
									);
								}
							},
						});
						stopSync = stop;
					}
				} catch (err) {
					console.error("[CubeAuthProvider] onSignIn DB init failed:", err);
				}
			}}
			onSignOut={async () => {
				// Stop background sync before tearing down the DB
				stopSync?.();
				stopSync = null;
				syncSessionUserId = null;

				setDbReady(false);
				setCurrentUserId(null);
				try {
					closeDb();
				} catch (err) {
					console.error("[CubeAuthProvider] onSignOut closeDb failed:", err);
				}
			}}
		>
			{props.children}
		</AuthProvider>
	);
};

export default CubeAuthProvider;
