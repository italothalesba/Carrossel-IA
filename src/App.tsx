/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ImagePlus, FileDown, Wifi, WifiOff, Loader2, Database, Menu, X, Zap, FlaskConical, Image, Gauge } from 'lucide-react';
import StyleManagement from './pages/StyleManagement';
import CarouselCreation from './pages/CarouselCreation';
import ApiManagement from './pages/ApiManagement';
import ApiTester from './pages/ApiTester';
import ImagePromptExporter from './pages/ImagePromptExporter';
import RateLimitDashboard from './pages/RateLimitDashboard';
import ApiKeyGate from './components/ApiKeyGate';
import AuthButton from './components/AuthButton';
import { cn } from './lib/utils';
import { generateMasterPromptPDF } from './lib/pdfGenerator';
import { useState, useEffect } from 'react';
import { db, doc, getDocFromServer } from './firebase';

function ConnectionStatus() {
  const [pineconeStatus, setPineconeStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [firebaseStatus, setFirebaseStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    const checkPinecone = async () => {
      try {
        const res = await fetch('/api/pinecone/health');
        const data = await res.json();
        setPineconeStatus(data.status === 'ok' ? 'online' : 'offline');
      } catch (e) {
        setPineconeStatus('offline');
      }
    };

    const checkFirebase = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setFirebaseStatus('online');
      } catch (e) {
        setFirebaseStatus('offline');
      }
    };

    checkPinecone();
    checkFirebase();
    const interval = setInterval(() => {
      checkPinecone();
      checkFirebase();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-1 px-4 py-2">
      <div className="flex items-center space-x-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">
        Status de Conexão
      </div>
      <div className="flex items-center space-x-2 text-xs font-medium">
        {pineconeStatus === 'loading' ? <Loader2 size={12} className="animate-spin text-gray-400" /> : pineconeStatus === 'online' ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-500" />}
        <span className={cn(pineconeStatus === 'online' ? "text-green-500" : "text-gray-400")}>Pinecone</span>
      </div>
      <div className="flex items-center space-x-2 text-xs font-medium">
        {firebaseStatus === 'loading' ? <Loader2 size={12} className="animate-spin text-gray-400" /> : firebaseStatus === 'online' ? <Database size={12} className="text-blue-500" /> : <Database size={12} className="text-red-500" />}
        <span className={cn(firebaseStatus === 'online' ? "text-blue-500" : "text-gray-400")}>Firebase</span>
      </div>
    </div>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Gestão de Estilos' },
    { to: '/create', icon: ImagePlus, label: 'Criação de Carrossel' },
    { to: '/export-images', icon: Image, label: 'Exportar Imagens' },
    { to: '/dashboard', icon: Gauge, label: 'Dashboard Rate Limits' },
    { to: '/apis', icon: Zap, label: 'Gerenciar APIs' },
    { to: '/test-api', icon: FlaskConical, label: 'Testar APIs' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col">
      <div className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          CarouselAI
        </h1>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        )}
      </div>
      
      <div className="mb-6">
        <ConnectionStatus />
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                isActive ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon size={20} />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <AuthButton />
    </div>
  );
}

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            CarouselAI
          </h1>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <ApiKeyGate>
            <Routes>
              <Route path="/" element={<StyleManagement />} />
              <Route path="/create" element={<CarouselCreation />} />
              <Route path="/export-images" element={<ImagePromptExporter />} />
              <Route path="/dashboard" element={<RateLimitDashboard />} />
              <Route path="/apis" element={<ApiManagement />} />
              <Route path="/test-api" element={<ApiTester />} />
            </Routes>
          </ApiKeyGate>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

