import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import ProduceDetailScreen from "../ProduceDetailScreen";
import type { Crop } from "../../types/crop";

const mockGetCropById = jest.fn();
jest.mock("../../services/cropLookup", () => ({
  getCropById: (...args: unknown[]) => mockGetCropById(...args),
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
    cumulativeExposureNote: "Multiple pesticides are frequently detected on the same sample.",
  },
  residueReductionTips: ["Rinse under running water."],
  lastUpdated: new Date("2026-07-21T00:00:00Z"),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
});
afterEach(cleanup);

async function renderScreen(cropId = "apple") {
  await act(async () => {
    render(<ProduceDetailScreen navigation={navigation} route={{ params: { cropId } } as never} />);
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
  expect(screen.getByText(/not a lab test of the specific item you scanned/)).toBeTruthy();
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
  });
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
