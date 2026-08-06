import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import PesticideInformationScreen from "../PesticideInformationScreen";
import type { ChemicalUse, RegisteredProducts, ResidueData } from "../../types/crop";

const CHEMICAL_USE: ChemicalUse = {
  sourceYear: 2025,
  sourceStates: ["CA", "WA"],
  topActiveIngredients: [{ name: "Carbaryl", percentAcresTreated: 51, category: "insecticide" }],
  dataAgeWarning: false,
};

const REGISTERED_PRODUCTS: RegisteredProducts = {
  sourceDate: "2026-07-21",
  activeIngredients: [{ name: "Mancozeb", epaRegistrationStatus: "Active", labelLinks: ["https://example.com/label.pdf"] }],
};

const RESIDUE_DATA: ResidueData = {
  sourceYear: 2024,
  sampleSize: 704,
  findings: [
    { chemical: "Pyrimethanil", percentSamplesDetected: 74.1, medianConcentration: 0.715, legalTolerance: 15, toleranceNote: null, units: "ppm" },
    { chemical: "Diazinon", percentSamplesDetected: 5.8, medianConcentration: 0.0067, legalTolerance: 0.5, toleranceNote: null, units: "ppm" },
  ],
  dataAgeWarning: false,
  cumulativeExposureNote: "Multiple pesticides are frequently detected on the same sample.",
};

beforeEach(() => {
  jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
});
afterEach(cleanup);

async function renderScreen(params: {
  cropName?: string;
  chemicalUse?: ChemicalUse | null;
  registeredProducts?: RegisteredProducts | null;
  residueData?: ResidueData | null;
}) {
  // Note: `??` would treat an explicitly-passed `null` the same as "not
  // provided" and silently fall back to the default, so these use `in`
  // checks instead — several tests rely on passing `null` deliberately.
  await act(async () => {
    render(
      <PesticideInformationScreen
        route={{
          params: {
            cropName: "cropName" in params ? params.cropName : "Apples",
            chemicalUse: "chemicalUse" in params ? params.chemicalUse : CHEMICAL_USE,
            registeredProducts: "registeredProducts" in params ? params.registeredProducts : REGISTERED_PRODUCTS,
            residueData: "residueData" in params ? params.residueData : RESIDUE_DATA,
          },
        } as never}
      />,
    );
  });
}

test("shows the crop name in the title", async () => {
  await renderScreen({ cropName: "Apples" });
  expect(screen.getByText("Pesticide Information for Apples")).toBeTruthy();
});

test("renders chemical use data with source year/states and the per-ingredient rows", async () => {
  await renderScreen({});
  expect(screen.getByText(/USDA NASS Quick Stats · 2025 · CA, WA/)).toBeTruthy();
  expect(screen.getByText(/Carbaryl/)).toBeTruthy();
  expect(screen.getByText("51% of acres")).toBeTruthy();
});

test("shows an empty-state message instead of a section when chemicalUse is null", async () => {
  await renderScreen({ chemicalUse: null });
  expect(screen.getByText("No USDA Ag Chemical Use data available for this crop yet.")).toBeTruthy();
});

test("shows the stale-data warning only when dataAgeWarning is true", async () => {
  await renderScreen({ chemicalUse: { ...CHEMICAL_USE, dataAgeWarning: true } });
  expect(screen.getByText(/more than 3 years old/)).toBeTruthy();
});

test("registered products section labels registration as permitted-for-use, not a safety judgment", async () => {
  await renderScreen({});
  expect(screen.getByText(/legally permitted for use.*NOT a safety judgment/)).toBeTruthy();
  expect(screen.getByText("Mancozeb")).toBeTruthy();
});

test("shows an empty-state message instead of a section when registeredProducts is null", async () => {
  await renderScreen({ registeredProducts: null });
  expect(screen.getByText("No EPA registration data available for this crop yet.")).toBeTruthy();
});

test("tapping a product's label link opens it", async () => {
  await renderScreen({});
  await act(async () => {
    fireEvent.press(screen.getByText("Label"));
  });
  expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/label.pdf");
});

test("shows the stale-data warning on residue findings only when dataAgeWarning is true", async () => {
  await renderScreen({ residueData: { ...RESIDUE_DATA, dataAgeWarning: true } });
  expect(screen.getByText(/more than 3 years old/)).toBeTruthy();
});

test("residue findings show percent detected, median concentration, and tolerance", async () => {
  await renderScreen({});
  expect(screen.getByText("Pyrimethanil")).toBeTruthy();
  expect(screen.getByText(/74.1% of samples · median 0.715 ppm/)).toBeTruthy();
  expect(screen.getByText("15 ppm limit")).toBeTruthy();
});

test("shows a tolerance note instead of a number when legalTolerance is null", async () => {
  await renderScreen({
    residueData: {
      ...RESIDUE_DATA,
      findings: [{ chemical: "Chlorpropham", percentSamplesDetected: 0.4, medianConcentration: 0.0075, legalTolerance: null, toleranceNote: "NT", units: "ppm" }],
    },
  });
  expect(screen.getByText("NT")).toBeTruthy();
});

test("shows an empty-state message instead of a section when residueData is null", async () => {
  await renderScreen({ residueData: null });
  expect(screen.getByText("No USDA/FDA residue testing data available for this crop yet.")).toBeTruthy();
});

test("shows the cumulative exposure note only when there's more than one residue finding", async () => {
  await renderScreen({}); // RESIDUE_DATA has 2 findings
  expect(screen.getByText(RESIDUE_DATA.cumulativeExposureNote)).toBeTruthy();
});

test("omits the cumulative exposure note when there's only one finding", async () => {
  await renderScreen({ residueData: { ...RESIDUE_DATA, findings: [RESIDUE_DATA.findings[0]] } });
  expect(screen.queryByText(RESIDUE_DATA.cumulativeExposureNote)).toBeNull();
});

test("tags findings at or above 75% of their legal tolerance as \"Near limit\"", async () => {
  await renderScreen({
    residueData: {
      ...RESIDUE_DATA,
      findings: [
        { chemical: "Pyrimethanil", percentSamplesDetected: 74.1, medianConcentration: 0.715, legalTolerance: 15, toleranceNote: null, units: "ppm" },
        { chemical: "Boscalid", percentSamplesDetected: 20, medianConcentration: 9, legalTolerance: 10, toleranceNote: null, units: "ppm" },
      ],
    },
  });
  expect(screen.getByText(/Near limit/)).toBeTruthy();
});

test("does not tag findings well under their legal tolerance", async () => {
  await renderScreen({}); // Pyrimethanil/Diazinon are both well under 75%
  expect(screen.queryByText(/Near limit/)).toBeNull();
});
