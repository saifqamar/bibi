import { Route, Routes } from "react-router";
import { NewSeriesPage } from "./series/NewSeriesPage";
import { SeriesListPage } from "./series/SeriesListPage";
import { SeriesWorkspace } from "./series/SeriesWorkspace";

export default function WriterApp() {
  return (
    <Routes>
      <Route index element={<SeriesListPage />} />
      <Route path="series/new" element={<NewSeriesPage />} />
      <Route path="series/:seriesId/*" element={<SeriesWorkspace />} />
    </Routes>
  );
}
