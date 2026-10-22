import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import ResidueReductionTipsScreen from "../ResidueReductionTipsScreen";
import { PremiumProvider } from "../../iap/PremiumContext";

jest.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "user-1" } }),
}));

async function renderScreen(cropName: string, tips: string[], organic?: boolean) {
  await act(async () => {
    render(
      <PremiumProvider>
        <ResidueReductionTipsScreen route={{ params: { cropName, tips, organic } } as never} />
      </PremiumProvider>,
    );
  });
}

test("shows the crop name in the title", async () => {
  await renderScreen("Apples", ["Rinse under running water."]);
  expect(screen.getByText("Reducing Residue on Apples")).toBeTruthy();
});

test("renders every tip", async () => {
  await renderScreen("Apples", ["Rinse under running water.", "Peel before eating."]);
  expect(screen.getByText(/Rinse under running water\./)).toBeTruthy();
  expect(screen.getByText(/Peel before eating\./)).toBeTruthy();
});

test("organic scans get a note that organic produce is washed the same way", async () => {
  await renderScreen("Organic Apples", ["Rinse under running water."], true);
  expect(screen.getByText("Wash organic produce the same way")).toBeTruthy();
  expect(screen.getByText(/Organic farming can still use approved pesticides/)).toBeTruthy();
});

test("conventional scans don't show the organic note", async () => {
  await renderScreen("Apples", ["Rinse under running water."]);
  expect(screen.queryByText("Wash organic produce the same way")).toBeNull();
});

test("lists the cited sources and opens one when tapped", async () => {
  jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  await renderScreen("Apples", ["Rinse under running water."], true);
  expect(screen.getByText("Sources")).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByText(/Virginia Tech Extension/));
  });
  expect(Linking.openURL).toHaveBeenCalledWith("https://pubs.ext.vt.edu/FST/fst-478/fst-478.html");
});
