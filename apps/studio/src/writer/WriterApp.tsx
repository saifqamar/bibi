import { Route, Routes } from "react-router";

function WriterHome() {
  return <h1 className="text-2xl font-bold">My series</h1>;
}

export default function WriterApp() {
  return (
    <Routes>
      <Route index element={<WriterHome />} />
    </Routes>
  );
}
