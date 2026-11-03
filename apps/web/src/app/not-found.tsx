import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-3xl font-bold">This story isn&apos;t here</h1>
      <p className="text-muted">
        It may have been taken down, or the link is wrong.
      </p>
      <Link href="/" className="text-primary">
        Browse stories
      </Link>
    </div>
  );
}
