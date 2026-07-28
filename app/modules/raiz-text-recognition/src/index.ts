import RaizTextRecognitionModule from "./RaizTextRecognitionModule";
import type { TextRecognitionResult } from "./RaizTextRecognition.types";

export type { TextRecognitionResult };

const TextRecognition = {
  recognize: (imageUri: string): Promise<TextRecognitionResult> => RaizTextRecognitionModule.recognize(imageUri),
};

export default TextRecognition;
