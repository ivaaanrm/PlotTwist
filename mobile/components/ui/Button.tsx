import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";
import type { ReactNode } from "react";

type ButtonVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";

type ButtonProps = PressableProps & {
  variant?: ButtonVariant;
  children: ReactNode;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-primary",
  secondary: "bg-secondary",
  destructive: "bg-destructive",
  outline: "border border-input bg-transparent",
  ghost: "bg-transparent",
};

const textClasses: Record<ButtonVariant, string> = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  destructive: "text-destructive-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
};

export function Button({
  variant = "default",
  children,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-lg px-6 py-3 ${variantClasses[variant]} ${disabled || loading ? "opacity-50" : ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "default" ? "#fafafa" : "#18181b"}
          className="mr-2"
        />
      ) : null}
      {typeof children === "string" ? (
        <Text className={`text-base font-semibold ${textClasses[variant]}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
