import { ActionSheetIOS, Alert, Platform } from "react-native";
import type { CollectionPublic } from "@/lib/types";

type PickerOptions = {
  title?: string;
  collections: CollectionPublic[];
  onSelect: (collectionId: string) => void;
};

export function showCollectionPicker({
  title = "Add to collection",
  collections,
  onSelect,
}: PickerOptions) {
  if (collections.length === 0) return;

  const options = [...collections.map((col) => col.name), "Cancel"];
  const cancelButtonIndex = options.length - 1;

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        if (buttonIndex === cancelButtonIndex) return;
        const selected = collections[buttonIndex];
        if (selected) onSelect(selected.id);
      }
    );
    return;
  }

  Alert.alert(
    title,
    undefined,
    options.map((option, index) => ({
      text: option,
      style: option === "Cancel" ? "cancel" : "default",
      onPress: () => {
        if (index === cancelButtonIndex) return;
        const selected = collections[index];
        if (selected) onSelect(selected.id);
      },
    }))
  );
}
