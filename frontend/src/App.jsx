import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Context from "./pages/Context";
import HowToDonate from "./pages/HowToDonate";
import Transparency from "./pages/Transparency";
import MunicipalityDetail from "./pages/MunicipalityDetail";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/entenda", element: <Context /> },
      { path: "/passo-a-passo", element: <HowToDonate /> },
      { path: "/transparencia", element: <Transparency /> },
      { path: "/transparencia/:municipioId", element: <MunicipalityDetail /> },
      { path: "/sobre", element: <About /> },
      // Endereços antigos continuam funcionando
      { path: "/contexto", element: <Navigate to="/entenda" replace /> },
      { path: "/como-doar", element: <Navigate to="/passo-a-passo" replace /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
