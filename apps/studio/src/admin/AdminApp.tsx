import { Route, Routes } from "react-router";
import { ReviewDetailPage } from "./reviews/ReviewDetailPage";
import { ReviewQueuePage } from "./reviews/ReviewQueuePage";

/** Loaded lazily so writers never download admin code. */
export default function AdminApp() {
  return (
    <Routes>
      <Route index element={<ReviewQueuePage />} />
      <Route path="reviews/:itemId" element={<ReviewDetailPage />} />
    </Routes>
  );
}
