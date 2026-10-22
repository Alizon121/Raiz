import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import FavoriteScreen from "../FavoriteScreen";
import { PremiumProvider } from "../../iap/PremiumContext";

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useEffect } = require("react");
    useEffect(() => callback(), []);
  },
}));

const mockNavigate = jest.fn();
const navigation = { navigate: mockNavigate } as never;

jest.mock("../../auth/AuthContext", () => ({ useAuth: () => ({ user: { uid: "user-1" } }) }));

const mockGetFavorites = jest.fn();
jest.mock("../../services/favorites", () => ({
  getFavorites: (...args: unknown[]) => mockGetFavorites(...args),
}));

beforeEach(() => jest.clearAllMocks());
afterEach(cleanup);

const FAVORITES = [
  { id: "apple__organic", cropId: "apple", cropName: "Apples", imageUrl: null, organic: true, favoritedAt: new Date() },
  { id: "apple", cropId: "apple", cropName: "Apples", imageUrl: null, organic: false, favoritedAt: new Date() },
];

async function renderScreen() {
  await act(async () => {
    render(
      <PremiumProvider>
        <FavoriteScreen navigation={navigation} route={{} as never} />
      </PremiumProvider>,
    );
  });
}

test("lists organic and conventional favorites of the same crop as separate rows", async () => {
  mockGetFavorites.mockResolvedValue(FAVORITES);
  await renderScreen();
  expect(screen.getByText("Organic Apples")).toBeTruthy();
  expect(screen.getByText("Apples")).toBeTruthy();
});

test("tapping the organic row opens ProduceDetail as organic; the conventional row does not", async () => {
  mockGetFavorites.mockResolvedValue(FAVORITES);
  await renderScreen();

  await act(async () => {
    fireEvent.press(screen.getByText("Organic Apples"));
  });
  expect(mockNavigate).toHaveBeenLastCalledWith("ProduceDetail", { cropId: "apple", organic: true });

  await act(async () => {
    fireEvent.press(screen.getByText("Apples"));
  });
  expect(mockNavigate).toHaveBeenLastCalledWith("ProduceDetail", { cropId: "apple" });
});
