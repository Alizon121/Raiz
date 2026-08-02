import { act, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "../AuthContext";

jest.mock("../../firebase/config", () => ({ auth: { __fake: "auth" }, db: { __fake: "db" } }));

let authStateCallback: ((user: unknown) => void | Promise<void>) | null = null;
const mockOnAuthStateChanged = jest.fn((_auth, callback) => {
  authStateCallback = callback;
  return () => {}; // unsubscribe
});
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: (...args: [unknown, (user: unknown) => void | Promise<void>]) => mockOnAuthStateChanged(...args),
}));

const mockDoc = jest.fn((_db, collection, id) => ({ __fake: "docRef", collection, id }));
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => "__server_timestamp__");
jest.mock("firebase/firestore", () => ({
  doc: (...args: [unknown, string, string]) => mockDoc(...args),
  getDoc: (...args: [unknown]) => mockGetDoc(...args),
  setDoc: (...args: [unknown, unknown]) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

function Probe() {
  const { user, initializing } = useAuth();
  return <Text>{initializing ? "initializing" : user ? `user:${user.uid}` : "signed-out"}</Text>;
}

// React 19's passive-effect flush happens on a microtask that a plain
// synchronous render() doesn't wait for — AuthProvider's useEffect (which
// calls onAuthStateChanged) wouldn't have run yet by the time assertions
// run unless the render itself is wrapped in an async act().
async function renderProvider() {
  await act(async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  authStateCallback = null;
});

test("starts in the initializing state before Firebase reports any auth state", async () => {
  await renderProvider();
  // No auth state event fired yet in this test, so still initializing.
  expect(mockOnAuthStateChanged).toHaveBeenCalled();
  expect(screen.getByText("initializing")).toBeTruthy();
});

test("creates the users/{uid} doc with the spec's default fields when it doesn't exist yet", async () => {
  mockGetDoc.mockResolvedValue({ exists: () => false });
  await renderProvider();

  await act(async () => {
    await authStateCallback!({ uid: "user-123" });
  });

  expect(mockDoc).toHaveBeenCalledWith({ __fake: "db" }, "users", "user-123");
  expect(mockSetDoc).toHaveBeenCalledWith(
    { __fake: "docRef", collection: "users", id: "user-123" },
    { subscriptionStatus: "none", createdAt: "__server_timestamp__" },
  );
  expect(screen.getByText("user:user-123")).toBeTruthy();
});

test("does not overwrite an existing users/{uid} doc (e.g. subscriptionStatus) on repeat sign-ins", async () => {
  mockGetDoc.mockResolvedValue({ exists: () => true });
  await renderProvider();

  await act(async () => {
    await authStateCallback!({ uid: "returning-user" });
  });

  expect(mockSetDoc).not.toHaveBeenCalled();
  expect(screen.getByText("user:returning-user")).toBeTruthy();
});

test("signing out (null user) does not touch Firestore at all", async () => {
  await renderProvider();

  await act(async () => {
    await authStateCallback!(null);
  });

  expect(mockGetDoc).not.toHaveBeenCalled();
  expect(mockSetDoc).not.toHaveBeenCalled();
  expect(screen.getByText("signed-out")).toBeTruthy();
});
