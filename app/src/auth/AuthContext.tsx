import { type User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, initializing: true });

/** Creates the users/{userId} doc on first sign-in, matching the build spec's schema. */
async function ensureUserDoc(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  await setDoc(ref, {
    createdAt: serverTimestamp(),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser) {
        await ensureUserDoc(nextUser);
      }
      setUser(nextUser);
      setInitializing(false);
    });
  }, []);

  return <AuthContext.Provider value={{ user, initializing }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
