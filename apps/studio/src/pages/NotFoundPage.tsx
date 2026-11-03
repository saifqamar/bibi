import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-4">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link className="text-primary underline" to="/">
        Go home
      </Link>
    </div>
  );
}
