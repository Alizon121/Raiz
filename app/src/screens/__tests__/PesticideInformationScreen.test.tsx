import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import PesticideInformationScreen from "../PesticideInformationScreen";
import { PremiumProvider } from "../../iap/PremiumContext";
import type { ChemicalUse, RegisteredProducts, ResidueData } from "../../types/crop";

jest.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "user-1" } }),
}));

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
  scannedAsOrganic?: boolean;
}) {
  // Note: `??` would treat an explicitly-passed `null` the same as "not
  // provided" and silently fall back to the default, so these use `in`
  // checks instead — several tests rely on passing `null` deliberately.
  await act(async () => {
    render(
      <PremiumProvider>
        <PesticideInformationScreen
          route={{
            params: {
              cropName: "cropName" in params ? params.cropName : "Apples",
              chemicalUse: "chemicalUse" in params ? params.chemicalUse : CHEMICAL_USE,
              registeredProducts: "registeredProducts" in params ? params.registeredProducts : REGISTERED_PRODUCTS,
              residueData: "residueData" in params ? params.residueData : RESIDUE_DATA,
              scannedAsOrganic: params.scannedAsOrganic,
            },
          } as never}
        />
      </PremiumProvider>,
    );
  });
}

// Every section starts collapsed (see AccordionSection in
// PesticideInformationScreen) — its content, including the empty-state
// text, doesn't exist in the tree until its header is tapped open.
async function expandSection(title: string) {
  await act(async () => {
    fireEvent.press(screen.getByText(title));
  });
}

test("shows the crop name in the title", async () => {
  await renderScreen({ cropName: "Apples" });
  expect(screen.getByText("Pesticide Information for Apples")).toBeTruthy();
});

test("renders chemical use data with source year/states and the per-ingredient rows", async () => {
  await renderScreen({});
  await expandSection("Common Active Ingredients");
  expect(screen.getByText(/USDA NASS Quick Stats · 2025 · CA, WA/)).toBeTruthy();
  expect(screen.getByText(/Carbaryl/)).toBeTruthy();
  expect(screen.getByText("51% of acres")).toBeTruthy();
});

test("shows an empty-state message instead of a section when chemicalUse is null", async () => {
  await renderScreen({ chemicalUse: null });
  await expandSection("Common Active Ingredients");
  expect(screen.getByText("No USDA Ag Chemical Use data available for this crop yet.")).toBeTruthy();
});

test("shows the stale-data warning only when dataAgeWarning is true", async () => {
  await renderScreen({ chemicalUse: { ...CHEMICAL_USE, dataAgeWarning: true } });
  await expandSection("Common Active Ingredients");
  expect(screen.getByText(/more than 3 years old/)).toBeTruthy();
});

test("registered products section labels registration as permitted-for-use, not a safety judgment", async () => {
  await renderScreen({});
  await expandSection("Registered Products");
  expect(screen.getByText(/legally permitted for use.*NOT a safety judgment/)).toBeTruthy();
  expect(screen.getByText("Mancozeb")).toBeTruthy();
});

test("shows an empty-state message instead of a section when registeredProducts is null", async () => {
  await renderScreen({ registeredProducts: null });
  await expandSection("Registered Products");
  expect(screen.getByText("No EPA registration data available for this crop yet.")).toBeTruthy();
});

test("tapping a product's label link opens it", async () => {
  await renderScreen({});
  await expandSection("Registered Products");
  await act(async () => {
    fireEvent.press(screen.getByText("Label"));
  });
  expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/label.pdf");
});

test("shows the stale-data warning on residue findings only when dataAgeWarning is true", async () => {
  await renderScreen({ residueData: { ...RESIDUE_DATA, dataAgeWarning: true } });
  await expandSection("Residue Findings");
  expect(screen.getByText(/more than 3 years old/)).toBeTruthy();
});

test("residue findings show percent detected, median concentration, and tolerance", async () => {
  await renderScreen({});
  await expandSection("Residue Findings");
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
  await expandSection("Residue Findings");
  expect(screen.getByText("NT")).toBeTruthy();
});

test("shows an empty-state message instead of a section when residueData is null", async () => {
  await renderScreen({ residueData: null });
  await expandSection("Residue Findings");
  expect(screen.getByText("No USDA/FDA residue testing data available for this crop yet.")).toBeTruthy();
});

test("shows the cumulative exposure note only when there's more than one residue finding", async () => {
  await renderScreen({}); // RESIDUE_DATA has 2 findings
  await expandSection("Residue Findings");
  expect(screen.getByText(RESIDUE_DATA.cumulativeExposureNote)).toBeTruthy();
});

test("omits the cumulative exposure note when there's only one finding", async () => {
  await renderScreen({ residueData: { ...RESIDUE_DATA, findings: [RESIDUE_DATA.findings[0]] } });
  await expandSection("Residue Findings");
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
  await expandSection("Residue Findings");
  expect(screen.getByText(/Near limit/)).toBeTruthy();
});

test("does not tag findings well under their legal tolerance", async () => {
  await renderScreen({}); // Pyrimethanil/Diazinon are both well under 75%
  await expandSection("Residue Findings");
  expect(screen.queryByText(/Near limit/)).toBeNull();
});

const ORGANIC = {
  sourceYear: 2022,
  dataAgeWarning: true,
  sampleSize: 57,
  findings: [{ chemical: "Spinosad", percentSamplesDetected: 3.5, medianConcentration: 0.01, legalTolerance: 0.2, toleranceNote: null, units: "ppm" }],
};

test("conventional view shows only conventional findings, never the organic ones", async () => {
  await renderScreen({ residueData: { ...RESIDUE_DATA, organic: ORGANIC } });
  await expandSection("Residue Findings");
  expect(screen.getByText("Pyrimethanil")).toBeTruthy();
  expect(screen.queryByText("Spinosad")).toBeNull();
  expect(screen.getByText(/704 conventional samples tested/)).toBeTruthy();
});

test("organic scan: Residue Findings opens by default and shows only organic findings, with its own year and age warning", async () => {
  await renderScreen({ scannedAsOrganic: true, cropName: "Organic Apples", residueData: { ...RESIDUE_DATA, organic: ORGANIC } });
  // no expandSection call - already open
  expect(screen.getByText("Pesticide Information for Organic Apples")).toBeTruthy();
  expect(screen.getByText("Spinosad")).toBeTruthy();
  expect(screen.queryByText("Pyrimethanil")).toBeNull();
  expect(screen.getByText(/2022 · 57 organic samples tested/)).toBeTruthy();
  expect(screen.getByText(/more than 3 years old/)).toBeTruthy();
  expect(screen.getByText(/not a verified certification/)).toBeTruthy();
});

test("organic scan with no organic samples shows an empty message, not conventional data", async () => {
  await renderScreen({ scannedAsOrganic: true, residueData: { ...RESIDUE_DATA, organic: null } });
  expect(screen.getByText("No organic samples of this crop were found in the recent USDA/FDA testing years.")).toBeTruthy();
  expect(screen.queryByText("Pyrimethanil")).toBeNull();
});

test("organic scan with organic samples but no detections says none were detected", async () => {
  await renderScreen({ scannedAsOrganic: true, residueData: { ...RESIDUE_DATA, organic: { ...ORGANIC, dataAgeWarning: false, findings: [] } } });
  expect(screen.getByText("No pesticide residues were detected in the organic samples tested.")).toBeTruthy();
});

test("conventional view with zero conventional samples says so without borrowing organic data", async () => {
  await renderScreen({ residueData: { ...RESIDUE_DATA, sampleSize: 0, findings: [], organic: ORGANIC } });
  await expandSection("Residue Findings");
  expect(screen.getByText(/No conventional samples of this crop were tested this year/)).toBeTruthy();
  expect(screen.queryByText("Spinosad")).toBeNull();
});

test("organic scan marks the chemical-use and registered-product sections as not organic-specific", async () => {
  await renderScreen({ scannedAsOrganic: true, residueData: { ...RESIDUE_DATA, organic: ORGANIC } });
  await expandSection("Registered Products");
  expect(screen.getAllByText("This section is not organic-specific.").length).toBeGreaterThan(0);
});
