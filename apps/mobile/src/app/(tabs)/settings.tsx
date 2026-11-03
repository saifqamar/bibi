import { useDeleteAccount } from "@bibi/query-hooks";
import { useState } from "react";
import { Text, View } from "react-native";
import { Body, Button, Screen, Title } from "@/components/ui";
import { errorMessage } from "@/lib/format";
import { useDownloads } from "@/downloads/store";
import { useSession } from "@/lib/session";
import { usePlayer } from "@/player/store";

export default function Settings() {
  const { user, signOut } = useSession();
  const [confirming, setConfirming] = useState(false);
  // Downloads belong to the account: leaving removes them from this device too.
  const leave = async () => {
    await usePlayer.getState().stop();
    await useDownloads.getState().clearLocal();
    await signOut();
  };
  const deleteAccount = useDeleteAccount(() => void leave());
  return (
    <Screen>
      <View className="gap-6 px-4 py-4">
        <Title>Settings</Title>
        <Body muted>Signed in as {user?.email}</Body>
        <Button
          variant="outline"
          label="Sign out"
          onPress={() => void leave()}
        />
        <View className="gap-3 rounded-xl border border-border p-4 dark:border-border-dark">
          <Text className="font-semibold text-foreground dark:text-foreground-dark">
            Delete account
          </Text>
          <Body muted className="text-sm">
            This removes your account, progress and downloads. Listening
            statistics are kept without your name.
          </Body>
          {confirming ? (
            <View className="gap-2">
              <Button
                variant="danger"
                label="Delete my account"
                disabled={deleteAccount.isPending}
                onPress={() => deleteAccount.mutate()}
              />
              <Button
                variant="outline"
                label="Keep my account"
                onPress={() => setConfirming(false)}
              />
            </View>
          ) : (
            <Button
              variant="outline"
              label="Delete account…"
              onPress={() => setConfirming(true)}
            />
          )}
          {deleteAccount.isError && (
            <Text className="text-danger">
              {errorMessage(deleteAccount.error)}
            </Text>
          )}
        </View>
      </View>
    </Screen>
  );
}
