import ExpoModulesCore
import Vision
import UIKit

enum RaizTextRecognitionError: Error, LocalizedError {
  case invalidImage(String)
  case recognitionFailed(String)

  var errorDescription: String? {
    switch self {
    case .invalidImage(let uri): return "Could not load image at \(uri)"
    case .recognitionFailed(let message): return "Text recognition failed: \(message)"
    }
  }
}

// Replaces @react-native-ml-kit/text-recognition, whose vendored
// MLImage.framework has no arm64-iOS-Simulator slice (only arm64-device +
// x86_64-simulator), making it unbuildable for this Mac's native arm64
// simulators. Apple's own on-device Vision framework has no such gap and
// needs no third-party pod.
public class RaizTextRecognitionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("RaizTextRecognition")

    AsyncFunction("recognize") { (imageUri: String, promise: Promise) in
      guard
        let url = URL(string: imageUri),
        let data = try? Data(contentsOf: url),
        let image = UIImage(data: data),
        let cgImage = image.cgImage
      else {
        promise.reject(RaizTextRecognitionError.invalidImage(imageUri))
        return
      }

      let request = VNRecognizeTextRequest { request, error in
        if let error = error {
          promise.reject(RaizTextRecognitionError.recognitionFailed(error.localizedDescription))
          return
        }
        let observations = request.results as? [VNRecognizedTextObservation] ?? []
        let lines = observations.compactMap { $0.topCandidates(1).first?.string }
        promise.resolve(["text": lines.joined(separator: "\n")])
      }
      // Digits on a PLU sticker are small and printed in a plain font —
      // accurate mode over fast mode, and skip language correction since
      // it would otherwise try to "fix" digit sequences into words.
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = false

      do {
        try VNImageRequestHandler(cgImage: cgImage, options: [:]).perform([request])
      } catch {
        promise.reject(RaizTextRecognitionError.recognitionFailed(error.localizedDescription))
      }
    }
  }
}
