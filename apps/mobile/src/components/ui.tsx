import { useNetInfo } from "@react-native-community/netinfo";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <OfflineBanner />
      {children}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted = false,
  className = "",
}: {
  children: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <Text
      className={`${muted ? "text-muted dark:text-muted-dark" : "text-foreground dark:text-foreground-dark"} text-base ${className}`}
    >
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline" | "danger";
}) {
  const styles = {
    primary: "bg-primary dark:bg-primary-dark",
    outline: "border border-border dark:border-border-dark",
    danger: "bg-danger",
  }[variant];
  const text =
    variant === "outline"
      ? "text-foreground dark:text-foreground-dark"
      : "text-white dark:text-black";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-12 items-center justify-center rounded-xl px-5 ${styles} ${disabled ? "opacity-50" : ""}`}
    >
      <Text className={`text-base font-semibold ${text}`}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8a8992"
        className="min-h-12 rounded-xl border border-border px-4 text-base text-foreground dark:border-border-dark dark:text-foreground-dark"
        {...props}
      />
    </View>
  );
}

/** Every story is labelled AI-assisted for listeners. */
export function AiBadge() {
  return (
    <View
      accessibilityLabel="AI-assisted story"
      className="self-start rounded-full bg-primary/10 px-2 py-0.5 dark:bg-primary-dark/20"
    >
      <Text className="text-xs font-semibold text-primary dark:text-primary-dark">
        AI-assisted
      </Text>
    </View>
  );
}

export function OfflineBanner() {
  const net = useNetInfo();
  if (net.isConnected !== false) return null;
  return (
    <View
      accessibilityRole="alert"
      className="bg-foreground px-4 py-2 dark:bg-foreground-dark"
    >
      <Text className="text-center text-sm text-background dark:text-background-dark">
        You are offline. Showing saved stories.
      </Text>
    </View>
  );
}

export function Loading() {
  return (
    <View
      accessibilityLabel="Loading"
      className="flex-1 items-center justify-center py-12"
    >
      <ActivityIndicator />
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View accessibilityRole="alert" className="items-center gap-3 px-6 py-12">
      <Body muted>{message}</Body>
      <Button variant="outline" label="Try again" onPress={onRetry} />
    </View>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="items-center gap-1 px-6 py-12">
      <Body>{title}</Body>
      {hint && (
        <Body muted className="text-center text-sm">
          {hint}
        </Body>
      )}
    </View>
  );
}
