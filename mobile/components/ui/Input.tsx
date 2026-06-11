import { TextInput, type TextInputProps } from "react-native";

type InputProps = TextInputProps & {
  error?: boolean;
};

export function Input({ error, className, ...props }: InputProps) {
  return (
    <TextInput
      className={`rounded-lg border bg-transparent px-4 py-3 text-base text-foreground ${error ? "border-destructive" : "border-input"} ${className ?? ""}`}
      placeholderTextColor="#71717a"
      autoCapitalize="none"
      {...props}
    />
  );
}
