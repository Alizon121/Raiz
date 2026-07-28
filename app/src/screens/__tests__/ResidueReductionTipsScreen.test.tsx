import { act, render, screen } from "@testing-library/react-native";
import ResidueReductionTipsScreen from "../ResidueReductionTipsScreen";

async function renderScreen(cropName: string, tips: string[]) {
  await act(async () => {
    render(
      <ResidueReductionTipsScreen navigation={{} as never} route={{ params: { cropName, tips } } as never} />,
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
