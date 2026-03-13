/// <reference types="vite/client" />
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
	getAuth,
	type Auth,
	GoogleAuthProvider,
	signInWithPopup,
	onAuthStateChanged,
	signOut as fbSignOut,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initFirebase() {
	if (app) return { app, auth, db };
	const config = {
		apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
		authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
		projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
		storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
		appId: import.meta.env.VITE_FIREBASE_APP_ID,
	} as const;
	const hasAllConfig =
		!!config.apiKey && !!config.authDomain && !!config.projectId && !!config.appId;
	try {
		if (!hasAllConfig) {
			if (import.meta.env.DEV) {
				console.warn("[firebase] Missing config. Auth/DB disabled (dev mode).", config);
			}
			return { app: null, auth: null, db: null };
		}
		app = initializeApp(config);
		auth = getAuth(app);
		db = getFirestore(app);
	} catch (e) {
		console.warn("[firebase] init failed; disabling Firebase:", e);
		app = null;
		auth = null;
		db = null;
	}
	return { app, auth, db };
}

export function subscribeAuth(cb: (user: User | null) => void): () => void {
	const { auth } = initFirebase();
	if (!auth) {
		cb(null);
		return () => {};
	}
	return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle() {
	const { auth } = initFirebase();
	if (!auth) throw new Error("Firebase unavailable: auth not initialized");
	const provider = new GoogleAuthProvider();
	await signInWithPopup(auth, provider);
}

export async function signOut() {
	const { auth } = initFirebase();
	if (!auth) return;
	await fbSignOut(auth);
}

export async function signInWithEmail(email: string, password: string) {
	const { auth } = initFirebase();
	if (!auth) throw new Error("Firebase unavailable: auth not initialized");
	await signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string) {
	const { auth } = initFirebase();
	if (!auth) throw new Error("Firebase unavailable: auth not initialized");
	await createUserWithEmailAndPassword(auth, email, password);
}
