import { registerWebModule, NativeModule } from 'expo';

class RaizTextRecognitionModule extends NativeModule<{}> {}

export default registerWebModule(RaizTextRecognitionModule, 'RaizTextRecognitionModule');
