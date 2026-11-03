import { unwrap } from "@bibi/api-client";
import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Field, Screen, Title } from "@/components/ui";
import { api, storeTokenPair } from "@/lib/api";
import { errorMessage } from "@/lib/format";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const signUp = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/auth/signup", {
          body: { email, password, display_name: name || null },
        }),
      ),
    onSuccess: storeTokenPair,
  });
  const tooShort = password.length > 0 && password.length < 8;
  return (
    <Screen>
      <View className="flex-1 justify-center gap-5 px-6">
        <Title>Create your account</Title>
        <Field label="Name (optional)" value={name} onChangeText={setName} />
        <Field
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label="Password"
          secureTextEntry
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
        />
        {tooShort && (
          <Text className="text-sm text-muted dark:text-muted-dark">
            Use at least 8 characters.
          </Text>
        )}
        {signUp.isError && (
          <Text accessibilityRole="alert" className="text-danger">
            {errorMessage(signUp.error)}
          </Text>
        )}
        <Button
          label={signUp.isPending ? "Creating…" : "Create account"}
          disabled={signUp.isPending || !email || password.length < 8}
          onPress={() => signUp.mutate()}
        />
        <Link
          href="/sign-in"
          className="text-center text-primary dark:text-primary-dark"
        >
          I already have an account
        </Link>
      </View>
    </Screen>
  );
}
