import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  signInAnonymously
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if specified in config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { onAuthStateChanged };

// Google Sign-In helper
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Save user profile document
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "SAT Student",
        photoURL: user.photoURL || "",
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    return user;
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

// Guest Sign-In helper
export async function signInAsGuest() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error("Guest Sign-In Error:", error);
    throw error;
  }
}

// Sign Out helper
export async function logOut() {
  return signOut(auth);
}

// Save or sync user SAT profile to Firestore
export async function syncUserProfile(userId: string, profileData: any) {
  if (!userId) return;
  try {
    await setDoc(
      doc(db, "users", userId),
      {
        profile: profileData,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Error syncing user profile:", err);
  }
}

// Save or sync user settings & study reminders
export async function syncUserSettings(userId: string, settingsData: any) {
  if (!userId) return;
  try {
    await setDoc(
      doc(db, "users", userId),
      {
        reminderSettings: settingsData,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Error syncing user settings:", err);
  }
}

// Save study log entry to Firestore
export async function saveFirestoreStudyLog(
  userId: string,
  logEntry: { id?: string; date: string; mathHours: number; readingHours: number; writingHours: number }
) {
  if (!userId) return;
  try {
    const logId = logEntry.id || `l_${Date.now()}`;
    const logDocRef = doc(db, "users", userId, "studyLogs", logId);
    await setDoc(logDocRef, {
      ...logEntry,
      id: logId,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error saving study log:", err);
  }
}

// Load study logs from Firestore
export async function fetchFirestoreStudyLogs(userId: string) {
  if (!userId) return [];
  try {
    const logsRef = collection(db, "users", userId, "studyLogs");
    const snapshot = await getDocs(logsRef);
    const logs: any[] = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    return logs;
  } catch (err) {
    console.error("Error fetching study logs:", err);
    return [];
  }
}

// Save mistake entry to Firestore
export async function saveFirestoreMistake(userId: string, mistake: any) {
  if (!userId) return;
  try {
    const docRef = doc(db, "users", userId, "mistakes", mistake.id || `m_${Date.now()}`);
    await setDoc(docRef, {
      ...mistake,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error saving mistake:", err);
  }
}

// Fetch mistake entries from Firestore
export async function fetchFirestoreMistakes(userId: string) {
  if (!userId) return [];
  try {
    const mistakesRef = collection(db, "users", userId, "mistakes");
    const snapshot = await getDocs(mistakesRef);
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  } catch (err) {
    console.error("Error fetching mistakes:", err);
    return [];
  }
}
