import { Route, Routes } from "react-router";

function AdminHome() {
  return <h1 className="text-2xl font-bold">Admin</h1>;
}

/** Loaded lazily so writers never download admin code. */
export default function AdminApp() {
  return (
    <Routes>
      <Route index element={<AdminHome />} />
    </Routes>
  );
}
