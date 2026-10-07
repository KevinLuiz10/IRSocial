import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Context from "./pages/Context";
import HowToDonate from "./pages/HowToDonate";
import Transparency from "./pages/Transparency";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/contexto" element={<Context />} />
          <Route path="/como-doar" element={<HowToDonate />} />
          <Route path="/transparencia" element={<Transparency />} />
          <Route path="/sobre" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
