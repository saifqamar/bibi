import { Route, Routes } from "react-router";
import { AnalyticsPlaceholder } from "./AnalyticsPlaceholder";
import { AuditLogPage } from "./audit/AuditLogPage";
import { SeriesAdminDetail } from "./catalog/SeriesAdminDetail";
import { SeriesAdminPage } from "./catalog/SeriesAdminPage";
import { ShelvesPage } from "./catalog/ShelvesPage";
import { CostsPage } from "./costs/CostsPage";
import { ReviewDetailPage } from "./reviews/ReviewDetailPage";
import { ReviewQueuePage } from "./reviews/ReviewQueuePage";
import { VoicesAdminPage } from "./voices/VoicesAdminPage";
import { WritersPage } from "./writers/WritersPage";

/** Loaded lazily so writers never download admin code. */
export default function AdminApp() {
  return (
    <Routes>
      <Route index element={<ReviewQueuePage />} />
      <Route path="reviews/:itemId" element={<ReviewDetailPage />} />
      <Route path="writers" element={<WritersPage />} />
      <Route path="series" element={<SeriesAdminPage />} />
      <Route path="series/:seriesId" element={<SeriesAdminDetail />} />
      <Route path="shelves" element={<ShelvesPage />} />
      <Route path="voices" element={<VoicesAdminPage />} />
      <Route path="costs" element={<CostsPage />} />
      <Route path="analytics" element={<AnalyticsPlaceholder />} />
      <Route path="audit" element={<AuditLogPage />} />
    </Routes>
  );
}
