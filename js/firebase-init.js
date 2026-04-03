// ─────────────────────────────────────────────────────────────────────────────
//  FIREBASE INIT
//  Firebase web API keys are NOT secret — they are public project identifiers.
//  Security is enforced entirely by Firestore Security Rules (not by hiding
//  this config). See: https://firebase.google.com/docs/projects/api-keys
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
    apiKey: "AIzaSyDUGAtMhkUW8aXSN6l3dU31JJICTDNaTAU",
    authDomain: "metal-fury-game-8c71a.firebaseapp.com",
    projectId: "metal-fury-game-8c71a",
    storageBucket: "metal-fury-game-8c71a.appspot.com",
    messagingSenderId: "505387039206",
    appId: "1:505387039206:web:7dd151531bfd4516447e27"
};

let db;
let auth;

if (typeof firebase !== 'undefined' && firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
} else {
    console.warn("Firebase SDK not loaded or config is missing.");
}

let playerId = null;
window.firebaseLoaded = false;

// ─────────────────────────────────────────────────────────────────────────────
//  LOAD
// ─────────────────────────────────────────────────────────────────────────────
window.loadUserDataFirebase = async function () {
    if (!db || !playerId) return;
    try {
        const docRef = db.collection("players").doc(playerId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            const data = docSnap.data();
            // Validate types on load to guard against corrupt/malicious Firestore data
            if (typeof data.coins === 'number' && data.coins >= 0) {
                window.coins = Math.floor(data.coins);
            }
            if (typeof data.skin === 'string' && data.skin.length < 64) {
                window.selectedSkin = data.skin;
                window.savedSkin = data.skin;
            }
            if (Array.isArray(data.ownedSkins)) {
                window.ownedSkins = data.ownedSkins.filter(s => typeof s === 'string' && s.length < 64);
                window.savedOwned = window.ownedSkins;
            }
            if (Array.isArray(data.highScores)) {
                window.highScores = data.highScores.slice(0, 8);
            }
        }

        window.firebaseLoaded = true;
        if (typeof renderLeaderboard === "function") renderLeaderboard();
        if (typeof updateHudUI === "function") updateHudUI();
    } catch (e) {
        console.error("Error loading Firebase data:", e);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  SAVE
// ─────────────────────────────────────────────────────────────────────────────
window.saveUserDataFirebase = function () {
    if (!db || !playerId) return;

    // Sanitize and type-check all values before writing to Firestore
    const payload = {
        coins: Math.max(0, Math.floor(Number(window.coins) || 0)),
        skin: typeof window.selectedSkin === 'string' ? window.selectedSkin : 'player1',
        ownedSkins: Array.isArray(window.ownedSkins)
            ? window.ownedSkins.filter(s => typeof s === 'string' && s.length < 64)
            : ['player1'],
        highScores: Array.isArray(window.highScores)
            ? window.highScores.slice(0, 8)
            : []
    };

    db.collection("players").doc(playerId).set(payload, { merge: true }).catch(e => {
        console.error("Error saving to Firebase:", e);
    });
};

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH STATE
// ─────────────────────────────────────────────────────────────────────────────
if (auth && db) {
    auth.onAuthStateChanged(user => {
        if (user) {
            playerId = user.uid;
            loadUserDataFirebase();
        } else {
            // Sign in anonymously — creates a unique persistent UID per browser session
            auth.signInAnonymously().catch(error => {
                console.error("Firebase Anonymous Auth failed:", error);
            });
        }
    });
}
