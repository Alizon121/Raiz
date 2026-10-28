package expo.modules.raiztextrecognition

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RaizTextRecognitionModule : Module() {
  // Created lazily and reused: the recognizer holds the on-device model.
  private val recognizer by lazy {
    TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
  }

  override fun definition() = ModuleDefinition {
    Name("RaizTextRecognition")

    AsyncFunction("recognize") { imageUri: String, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject(CodedException("ERR_NO_CONTEXT", "React context is not available", null))
        return@AsyncFunction
      }

      val image = try {
        InputImage.fromFilePath(context, Uri.parse(imageUri))
      } catch (e: Exception) {
        promise.reject(CodedException("ERR_INVALID_IMAGE", "Could not load image at $imageUri", e))
        return@AsyncFunction
      }

      // ML Kit runs inference off the main thread and calls back here.
      recognizer.process(image)
        .addOnSuccessListener { result ->
          // One line per entry, matching the iOS module's output shape.
          val lines = result.textBlocks.flatMap { block -> block.lines.map { it.text } }
          promise.resolve(mapOf("text" to lines.joinToString("\n")))
        }
        .addOnFailureListener { e ->
          promise.reject(CodedException("ERR_RECOGNITION_FAILED", e.localizedMessage ?: "Text recognition failed", e))
        }
    }

    OnDestroy {
      recognizer.close()
    }
  }
}
