import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/store";

export function NotAllowedPage() {
  const clear = useAuth((s) => s.clear);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-bold">Studio is for writers and admins</h1>
      <p className="text-muted-foreground">Listen to Bibi stories in the mobile app.</p>
      <Button variant="outline" onClick={clear}>
        Sign out
      </Button>
    </div>
  );
}
