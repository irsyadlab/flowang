import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex justify-center items-center font-sans w-full">
      <Outlet />
    </div>
  );
}
