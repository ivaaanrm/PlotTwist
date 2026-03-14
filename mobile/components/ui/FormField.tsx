import { View, Text } from "react-native";
import { Input } from "./Input";
import type { TextInputProps } from "react-native";

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, ...inputProps }: FormFieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <Input error={!!error} {...inputProps} />
      {error ? (
        <Text className="text-sm text-destructive">{error}</Text>
      ) : null}
    </View>
  );
}
