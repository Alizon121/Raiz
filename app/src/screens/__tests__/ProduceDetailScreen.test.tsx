import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import ProduceDetailScreen from "../ProduceDetailScreen";
import { PremiumProvider } from "../../iap/PremiumContext";
import type { Crop } from "../../types/crop";

jest.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "user-1" } }),
}));

const mockGetCropById = jest.fn();
jest.mock("../../services/cropLookup", () => ({
  getCropById: (...args: unknown[]) => mockGetCropById(...args),
}));

const mockIsFavorited = jest.fn().mockResolvedValue(false);
const mockAddFavorite = jest.fn().mockResolvedValue(undefined);
const mockRemoveFavorite = jest.fn().mockResolvedValue(undefined);
jest.mock("../../services/favorites", () => ({
  isFavorited: (...args: unknown[]) => mockIsFavorited(...args),
  addFavorite: (...args: unknown[]) => mockAddFavorite(...args),
  removeFavorite: (...args: unknown[]) => mockRemoveFavorite(...args),
}));

const mockDeleteScanHistoryEntry = jest.fn().mockResolvedValue(undefined);
jest.mock("../../services/scanHistory", () => ({
  deleteScanHistoryEntry: (...args: unknown[]) => mockDeleteScanHistoryEntry(...args),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const navigation = { navigate: mockNavigate, goBack: mockGoBack } as never;

const FULL_CROP: Crop = {
  cropId: "apple",
  cropName: "Apples",
  plu: ["4131"],
  commonAliases: ["apple"],
  chemicalUse: {
    sourceYear: 2025,
    sourceStates: ["CA", "WA"],
    topActiveIngredients: [{ name: "Carbaryl", percentAcresTreated: 51, category: "insecticide" }],
    dataAgeWarning: false,
  },
  registeredProducts: {
    sourceDate: "2026-07-21",
    activeIngredients: [{ name: "Mancozeb", epaRegistrationStatus: "Active", labelLinks: ["https://example.com/label.pdf"] }],
  },
  residueData: {
    sourceYear: 2024,
    sampleSize: 704,
    findings: [
      { chemical: "Pyrimethanil", percentSamplesDetected: 74.1, medianConcentration: 0.715, legalTolerance: 15, toleranceNote: null, units: "ppm" },
      { chemical: "Diazinon", percentSamplesDetected: 5.8, medianConcentration: 0.0067, legalTolerance: 0.5, toleranceNote: null, units: "ppm" },
    ],
    dataAgeWarning: false,
    cumulativeExposureNote: "Multiple pesticides are frequently detected on the same sample.",
  },
  residueReductionTips: ["Rinse under running water."],
  imageUrl: null,
  lastUpdated: new Date("2026-07-21T00:00:00Z"),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
});
afterEach(cleanup);

async function renderScreen(cropId = "apple", organic?: boolean) {
  await act(async () => {
    render(
      <PremiumProvider>
        <ProduceDetailScreen navigation={navigation} route={{ params: organic ? { cropId, organic } : { cropId } } as never} />
      </PremiumProvider>,
    );
  });
}

test("shows a not-found state when the crop doesn't exist", async () => {
  mockGetCropById.mockResolvedValue(null);
  await renderScreen();
  expect(screen.getByText("Not found")).toBeTruthy();
});

test("shows an error state when the lookup fails, with a way back to wherever the user came from", async () => {
  mockGetCropById.mockRejectedValue(new Error("offline"));
  await renderScreen();
  expect(screen.getByText("Something went wrong")).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText("Go back"));
  });
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});

test("always shows the \"not a lab test of your item\" disclaimer", async () => {
  mockGetCropById.mockResolvedValue(FULL_CROP);
  await renderScreen();
  expect(screen.getByText(/not a lab test of the specific item you scanned/i)).toBeTruthy();
});

test("the at-a-glance card links to the Residue Reduction Tips screen, passing the crop's name and tips", async () => {
  mockGetCropById.mockResolvedValue(FULL_CROP);
  await renderScreen();

  await act(async () => {
    fireEvent.press(screen.getByText("See tips to reduce residue"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("ResidueReductionTips", {
    cropName: "Apples",
    tips: FULL_CROP.residueReductionTips,
  });
});

test("omits the tips link when the crop has no residue-reduction tips", async () => {
  mockGetCropById.mockResolvedValue({ ...FULL_CROP, residueReductionTips: [] });
  await renderScreen();
  expect(screen.queryByText("See tips to reduce residue")).toBeNull();
});

test("the at-a-glance card links to the Pesticide Information screen, passing the crop's chemical/registration/residue data", async () => {
  mockGetCropById.mockResolvedValue(FULL_CROP);
  await renderScreen();

  await act(async () => {
    fireEvent.press(screen.getByText("Detailed Pesticide Information"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("PesticideInformation", {
    cropName: "Apples",
    chemicalUse: FULL_CROP.chemicalUse,
    registeredProducts: FULL_CROP.registeredProducts,
    residueData: FULL_CROP.residueData,
    scannedAsOrganic: false,
  });
});

test("when scanned as organic, shows a badge and passes scannedAsOrganic through to Pesticide Information", async () => {
  mockGetCropById.mockResolvedValue(FULL_CROP);
  await renderScreen("apple", true);
  expect(screen.getByText(/Scanned as organic/)).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByText("Detailed Pesticide Information"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("PesticideInformation", expect.objectContaining({ scannedAsOrganic: true }));
});

test("shows no organic badge for a conventional scan", async () => {
  mockGetCropById.mockResolvedValue(FULL_CROP);
  await renderScreen();
  expect(screen.queryByText(/Scanned as organic/)).toBeNull();
});

test("omits the pesticide information link when the crop has no chemical use data", async () => {
  mockGetCropById.mockResolvedValue({ ...FULL_CROP, chemicalUse: null });
  await renderScreen();
  expect(screen.queryByText("Detailed Pesticide Information")).toBeNull();
});

test("the at-a-glance summary counts active ingredients by category", async () => {
  mockGetCropById.mockResolvedValue({
    ...FULL_CROP,
    chemicalUse: {
      ...FULL_CROP.chemicalUse!,
      topActiveIngredients: [
        { name: "Carbaryl", percentAcresTreated: 51, category: "insecticide" },
        { name: "Acetamiprid", percentAcresTreated: 41, category: "insecticide" },
        { name: "Mancozeb", percentAcresTreated: 33, category: "fungicide" },
      ],
    },
  });
  await renderScreen();
  expect(screen.getByText("2 insecticides")).toBeTruthy();
  expect(screen.getByText("1 fungicide")).toBeTruthy();
  expect(screen.queryByText(/herbicide/)).toBeNull();
});

test("the summary shows a fallback message instead of chips when chemicalUse is null", async () => {
  mockGetCropById.mockResolvedValue({ ...FULL_CROP, chemicalUse: null });
  await renderScreen();
  expect(screen.getByText("No chemical use data available yet for this crop.")).toBeTruthy();
});

test("calls out residue findings at or above 75% of their legal tolerance, with the percentage", async () => {
  mockGetCropById.mockResolvedValue({
    ...FULL_CROP,
    residueData: {
      ...FULL_CROP.residueData!,
      findings: [
        { chemical: "Pyrimethanil", percentSamplesDetected: 74.1, medianConcentration: 0.715, legalTolerance: 15, toleranceNote: null, units: "ppm" },
        { chemical: "Boscalid", percentSamplesDetected: 20, medianConcentration: 9, legalTolerance: 10, toleranceNote: null, units: "ppm" },
      ],
    },
  });
  await renderScreen();
  expect(screen.getByText(/Worth a closer look/)).toBeTruthy();
  expect(screen.getByText(/Boscalid \(90%\)/)).toBeTruthy();
});

test("shows a reassurance line instead when no finding is close to its limit", async () => {
  mockGetCropById.mockResolvedValue(FULL_CROP); // Pyrimethanil/Diazinon are both well under 75%
  await renderScreen();
  expect(screen.queryByText(/Worth a closer look/)).toBeNull();
  expect(screen.getByText(/No chemicals were found near their legal tolerance levels/)).toBeTruthy();
});

test("shows neither the caution nor the reassurance line when there's no residue data at all", async () => {
  mockGetCropById.mockResolvedValue({ ...FULL_CROP, residueData: null });
  await renderScreen();
  expect(screen.queryByText(/Worth a closer look/)).toBeNull();
  expect(screen.queryByText(/No chemicals were found near their legal tolerance levels/)).toBeNull();
});

test("the summary's info toggle is hidden until tapped, then shows an explanation", async () => {
  mockGetCropById.mockResolvedValue(FULL_CROP);
  await renderScreen();

  expect(screen.queryByText(/Counts how many/)).toBeNull();

  await act(async () => {
    fireEvent.press(screen.getByLabelText("What does this summary show?"));
  });
  expect(screen.getByText(/Counts how many/)).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByLabelText("What does this summary show?"));
  });
  expect(screen.queryByText(/Counts how many/)).toBeNull();
});

test("footer shows the formatted last-updated date and source citation links", async () => {
  mockGetCropById.mockResolvedValue(FULL_CROP);
  await renderScreen();
  const expectedDate = FULL_CROP.lastUpdated.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  expect(screen.getByText(`Data current as of ${expectedDate}`)).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText("USDA NASS Quick Stats"));
  });
  expect(Linking.openURL).toHaveBeenCalledWith("https://quickstats.nass.usda.gov");
});

test("conventional scan with no conventional samples: says none are available, and never mentions organic data", async () => {
  mockGetCropById.mockResolvedValue({
    ...FULL_CROP,
    residueData: { ...FULL_CROP.residueData!, sampleSize: 0, findings: [], organic: { sourceYear: 2024, dataAgeWarning: false, sampleSize: 5, findings: [] } },
  });
  await renderScreen();
  expect(screen.getByText(/No conventional pesticide residue findings are available for this crop/)).toBeTruthy();
  expect(screen.queryByText(/organic/i)).toBeNull();
  expect(screen.queryByText(/No chemicals were found near their legal tolerance levels/)).toBeNull();
});

test("conventional samples tested with no detections: says none were detected instead of staying silent", async () => {
  mockGetCropById.mockResolvedValue({ ...FULL_CROP, residueData: { ...FULL_CROP.residueData!, findings: [] } });
  await renderScreen();
  expect(screen.getByText(/No pesticide residues were detected in conventional samples of this crop/)).toBeTruthy();
});

test("organic scan: title reads 'Organic <crop>' and the summary uses only organic findings", async () => {
  mockGetCropById.mockResolvedValue({
    ...FULL_CROP,
    residueData: {
      ...FULL_CROP.residueData!,
      organic: {
        sourceYear: 2024,
        dataAgeWarning: false,
        sampleSize: 20,
        findings: [{ chemical: "Boscalid", percentSamplesDetected: 20, medianConcentration: 9, legalTolerance: 10, toleranceNote: null, units: "ppm" }],
      },
    },
  });
  await renderScreen("apple", true);
  expect(screen.getByText("Organic Apples")).toBeTruthy();
  expect(screen.getByText(/Boscalid \(90%\)/)).toBeTruthy(); // organic finding drives the callout
});

test("organic scan with no organic samples: says so instead of falling back to conventional numbers", async () => {
  mockGetCropById.mockResolvedValue({ ...FULL_CROP, residueData: { ...FULL_CROP.residueData!, organic: null } });
  await renderScreen("apple", true);
  expect(screen.getByText(/No organic samples of this crop were found/)).toBeTruthy();
  expect(screen.queryByText(/No chemicals were found near their legal tolerance levels/)).toBeNull();
});

test("favoriting from an organic scan saves the organic variant, and checks the organic variant's state", async () => {
  mockGetCropById.mockResolvedValue(FULL_CROP);
  await renderScreen("apple", true);
  expect(mockIsFavorited).toHaveBeenCalledWith("user-1", "apple", true);
  await act(async () => {
    fireEvent.press(screen.getByText("Add to Favorites"));
  });
  expect(mockAddFavorite).toHaveBeenCalledWith("user-1", expect.objectContaining({ cropId: "apple", organic: true }));
});

test("organic scan passes organic: true and the organic title to the tips screen", async () => {
  mockGetCropById.mockResolvedValue(FULL_CROP);
  await renderScreen("apple", true);
  await act(async () => {
    fireEvent.press(screen.getByText("See tips to reduce residue"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("ResidueReductionTips", {
    cropName: "Organic Apples",
    tips: FULL_CROP.residueReductionTips,
    organic: true,
  });
});
