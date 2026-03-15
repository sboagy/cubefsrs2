import type { ParentComponent } from "solid-js";
import { AuthProvider } from "@rhizome/core";
import { getSupabaseClient } from "@/services/supabase";

/**
 * App-level auth provider for CubeFSRS.
 *
 * Thin wrapper over rhizome's AuthProvider with app-specific lifecycle hooks.
 * Renders children directly (without auth context) when Supabase is not
 * configured — allows the app to run offline in dev without a Supabase instance.
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
			onSignIn={async (_user, _session) => {
				// TODO Phase 4: initialize per-user SQLite DB and start sync worker
			}}
			onSignOut={async () => {
				// TODO Phase 4: tear down sync worker and clear local DB state
			}}
		>
			{props.children}
		</AuthProvider>
	);
};

export default CubeAuthProvider;
