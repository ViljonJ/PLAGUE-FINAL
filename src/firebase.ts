import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK for Auth
const app = initializeApp(firebaseConfig);

// We replace Firestore with MongoDB REST API calls!
export const db = {}; // dummy

export const auth = getAuth(app);
auth.useDeviceLanguage(); 

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName || null,
        email: provider.email || null,
        photoUrl: provider.photoURL || null
      })) || []
    }
  }
  const errorString = JSON.stringify(errInfo);
  if (errInfo.error.includes('Missing or insufficient permissions')) {
    console.error('Firestore Security Rules Error: ', errorString);
    throw new Error(errorString);
  } else {
    console.error('Database Error: ', errorString);
    if (errInfo.error.includes('Failed to fetch')) {
        // Just log fetch errors
        return;
    }
    throw new Error(errInfo.error);
  }
}

// ----- MONGODB SHIMS FOR FIRESTORE FUNCTIONS -----

export function doc(dbAlias: any, path: string) {
  return { path };
}

export async function setDoc(docRef: any, data: any, optionsOptions?: any, retries = 3): Promise<void> {
  const uid = docRef.path.split('/')[1];
  if (!uid) throw new Error("Invalid document path");
  try {
    const res = await fetch(`/api/users/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      if ([429, 502, 503, 504].includes(res.status) && retries > 0) {
        await new Promise(r => setTimeout(r, 2000));
        return setDoc(docRef, data, optionsOptions, retries - 1);
      }
      throw new Error(`Failed to set document data. Status: ${res.status}`);
    }
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return setDoc(docRef, data, optionsOptions, retries - 1);
    }
    throw err;
  }
}

export async function updateDoc(docRef: any, data: any, retries = 3): Promise<void> {
  const uid = docRef.path.split('/')[1];
  if (!uid) throw new Error("Invalid document path");
  try {
    const res = await fetch(`/api/users/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      if ([429, 502, 503, 504].includes(res.status) && retries > 0) {
        await new Promise(r => setTimeout(r, 2000));
        return updateDoc(docRef, data, retries - 1);
      }
      throw new Error(`Failed to update document data. Status: ${res.status}`);
    }
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return updateDoc(docRef, data, retries - 1);
    }
    throw err;
  }
}

export function onSnapshot(docRef: any, onNext: (snapshot: any) => void, onError?: (error: any) => void) {
  const uid = docRef.path.split('/')[1];
  if (!uid) {
    if (onError) onError(new Error("Invalid document path"));
    return () => {};
  }
  
  let isUnsubscribed = false;
  
  const fetchDoc = async (isInitial: boolean) => {
    try {
      const res = await fetch(`/api/users/${uid}`);
      const contentType = res.headers.get('content-type');
      
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (!isUnsubscribed) onNext({ exists: () => true, data: () => data });
      } else if (res.status === 404) {
        if (!isUnsubscribed) onNext({ exists: () => false, data: () => null });
      } else if (res.ok && contentType && contentType.includes('text/html')) {
        // Dev Server Proxy returned HTML string like 'Waking up...'
        if (isInitial && !isUnsubscribed) setTimeout(() => fetchDoc(true), 2000);
        return;
      } else if ([429, 502, 503, 504].includes(res.status)) {
        if (isInitial && !isUnsubscribed) setTimeout(() => fetchDoc(true), 2000);
        return; 
      } else {
        let errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to fetch document. Status: ${res.status}. Response: ${errorText.substring(0, 50)}`);
      }
    } catch (e: any) {
      if (e.message === 'Failed to fetch' || (e.name === 'TypeError' && e.message.includes('fetch'))) {
        if (isInitial && !isUnsubscribed) setTimeout(() => fetchDoc(true), 2000);
        return; // Ignore network errors, retry if initial, else wait for next poll
      }
      if (!isUnsubscribed && onError) onError(e);
    }
  };
  
  // Initial fetch
  fetchDoc(true);
  
  // Poll every 20 seconds to act like real-time updates and avoid rate limits
  const intervalId = setInterval(() => fetchDoc(false), 20000);
  
  return () => {
    isUnsubscribed = true;
    clearInterval(intervalId);
  };
}

export async function getDoc(docRef: any, retries = 3): Promise<any> {
  const uid = docRef.path.split('/')[1];
  if (!uid) throw new Error("Invalid document path");
  
  try {
    const res = await fetch(`/api/users/${uid}`);
    
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      const data = await res.json();
      return { exists: () => true, data: () => data };
    } else if (res.status === 404) {
      return { exists: () => false, data: () => null };
    } else if ((res.ok && contentType && contentType.includes('text/html')) || [429, 502, 503, 504].includes(res.status)) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 2000));
        return getDoc(docRef, retries - 1);
      }
      throw new Error(`Server is starting up. Please try again in a few moments.`);
    } else {
      let errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to get document. Status: ${res.status}. Response: ${errorText.substring(0, 50)}`);
    }
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return getDoc(docRef, retries - 1);
    }
    throw error;
  }
}

// Stubs for unused but exported functions to prevent breakdown
export function collection() { return {}; }
export function query() { return {}; }
export function where() { return {}; }
export async function getDocs() { return { docs: [] }; }

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type User
};

