import { unwrap } from "@bibi/api-client";
import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Body, Button, Field, Screen, Title } from "@/components/ui";
import { api, storeTokenPair } from "@/lib/api";
import { errorMessage } from "@/lib/format";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signIn = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/auth/login", { body: { email, password } }),
      ),
    onSuccess: storeTokenPair,
  });
  return (
    <Screen>
      <View className="flex-1 justify-center gap-5 px-6">
        <View className="gap-1">
          <Title>Bibi</Title>
          <Body muted>Audio stories and dramas with the depth of a novel.</Body>
        </View>
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
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />
        {signIn.isError && (
          <Text accessibilityRole="alert" className="text-danger">
            {errorMessage(signIn.error)}
          </Text>
        )}
        <Button
          label={signIn.isPending ? "Signing in…" : "Sign in"}
          disabled={signIn.isPending || !email || !password}
          onPress={() => signIn.mutate()}
        />
        <Link
          href="/sign-up"
          className="text-center text-primary dark:text-primary-dark"
        >
          New here? Create an account
        </Link>
      </View>
    </Screen>
  );
}
