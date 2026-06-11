import { cssInterop } from "nativewind";
import { Image as ExpoImage } from "expo-image";

// Enable NativeWind className support for expo-image.
cssInterop(ExpoImage, {
  className: "style",
});
