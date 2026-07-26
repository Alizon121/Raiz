import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import ScanScreen from "../ScanScreen";

const mockUseCameraPermissions = jest.fn();
const mockTakePictureAsync = jest.fn();
jest.mock("expo-camera", () => {
  const React = require("react");
  return {
    useCameraPermissions: () => mockUseCameraPermissions(),
    // Real CameraView is a native view; this mock renders its children (so
    // the shutter/manual-entry overlay is still testable) and exposes
    // takePictureAsync through the ref, same as the real component does.
    CameraView: React.forwardRef((props: { children?: React.ReactNode }, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({ takePictureAsync: mockTakePictureAsync }));
      return props.children ?? null;
    }),
  };
});

const mockRecognize = jest.fn();
jest.mock("@react-native-ml-kit/text-recognition", () => ({
  __esModule: true,
  default: { recognize: (...args: unknown[]) => mockRecognize(...args) },
}));

const mockGetAllKnownPlus = jest.fn();
jest.mock("../../services/cropLookup", () => ({
  getAllKnownPlus: () => mockGetAllKnownPlus(),
}));

const mockNavigate = jest.fn();
const navigation = { navigate: mockNavigate } as never;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAllKnownPlus.mockResolvedValue(new Set(["4131"]));
});
afterEach(cleanup);

async function renderScreen() {
  await act(async () => {
    render(<ScanScreen navigation={navigation} route={{} as never} />);
  });
}

test("shows a loading indicator while permission status is still being determined", async () => {
  mockUseCameraPermissions.mockReturnValue([null, jest.fn()]);
  await renderScreen();
  expect(screen.queryByText("Camera access needed")).toBeNull();
  expect(screen.queryByTestId("shutter-button")).toBeNull();
});

test("when permission is not granted, offers to request it and to fall back to manual entry", async () => {
  const mockRequestPermission = jest.fn();
  mockUseCameraPermissions.mockReturnValue([{ granted: false }, mockRequestPermission]);
  await renderScreen();

  expect(screen.getByText("Camera access needed")).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText("Enable Camera"));
  });
  expect(mockRequestPermission).toHaveBeenCalledTimes(1);

  await act(async () => {
    fireEvent.press(screen.getByText("Enter a PLU code manually instead"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("ManualEntry");
});

describe("when permission is granted", () => {
  beforeEach(() => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
  });

  test("capturing a photo that reads a known PLU navigates to ScanConfirm with it", async () => {
    mockTakePictureAsync.mockResolvedValue({ uri: "file://photo.jpg" });
    mockRecognize.mockResolvedValue({ text: "PLU 4131\nGala Apple", blocks: [] });

    await renderScreen();
    await act(async () => {
      fireEvent.press(screen.getByTestId("shutter-button"));
    });

    expect(mockRecognize).toHaveBeenCalledWith("file://photo.jpg");
    expect(mockNavigate).toHaveBeenCalledWith("ScanConfirm", { plu: "4131" });
  });

  test("shows an inline error and does not navigate when no PLU-shaped text is found", async () => {
    mockTakePictureAsync.mockResolvedValue({ uri: "file://photo.jpg" });
    mockRecognize.mockResolvedValue({ text: "Gala Apple", blocks: [] });

    await renderScreen();
    await act(async () => {
      fireEvent.press(screen.getByTestId("shutter-button"));
    });

    expect(screen.getByText(/Couldn't find a PLU code/)).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows an inline error when capture/recognition throws, instead of crashing", async () => {
    mockTakePictureAsync.mockRejectedValue(new Error("camera busy"));

    await renderScreen();
    await act(async () => {
      fireEvent.press(screen.getByTestId("shutter-button"));
    });

    expect(screen.getByText(/Something went wrong reading that photo/)).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("\"Enter manually instead\" is always available, even with camera access granted", async () => {
    await renderScreen();
    await act(async () => {
      fireEvent.press(screen.getByText("Enter manually instead"));
    });
    expect(mockNavigate).toHaveBeenCalledWith("ManualEntry");
  });
});
