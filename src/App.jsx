import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider } from './hooks/useAuth';

// Pages
import Home from './pages/Home';
import SanKhoa from './pages/SanKhoa';
import TienPhau from './pages/TienPhau';
import PhuKhoa from './pages/PhuKhoa';
import NhiKhoa from './pages/NhiKhoa';
import HauPhau from './pages/HauPhau';
import NoiKhoa from './pages/NoiKhoa';
import YHCT from './pages/YHCT';
import GMHS from './pages/GMHS';
import RangHamMat from './pages/RangHamMat';
import GopY from './pages/GopY';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Trang chu mac dinh */}
                <Route index element={<Home />} />

                {/* Benh an chuyen khoa */}
                <Route path="noikhoa" element={<NoiKhoa />} />
                <Route path="sankhoa" element={<SanKhoa />} />
                <Route path="phukhoa" element={<PhuKhoa />} />
                <Route path="nhikhoa" element={<NhiKhoa />} />
                <Route path="tienphau" element={<TienPhau />} />
                <Route path="hauphau" element={<HauPhau />} />
                <Route path="gmhs" element={<GMHS />} />
                <Route path="yhct" element={<YHCT />} />
                <Route path="ranghammat" element={<RangHamMat />} />

                {/* Gop y */}
                <Route path="gopy" element={<GopY />} />

                {/* 404 - Catch all */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
