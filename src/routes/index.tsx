import AppLayout from "@/layouts/AppLayout";
import Index from "@/pages/Index";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [{ index: true, element: <Index /> }],
  },
]);
