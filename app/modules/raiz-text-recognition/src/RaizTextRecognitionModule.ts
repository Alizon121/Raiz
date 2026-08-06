import { NativeModule, requireNativeModule } from "expo";
import type { TextRecognitionResult } from "./RaizTextRecognition.types";

declare class RaizTextRecognitionModule extends NativeModule<{}> {
  recognize(imageUri: string): Promise<TextRecognitionResult>;
}

export default requireNativeModule<RaizTextRecognitionModule>("RaizTextRecognition");
