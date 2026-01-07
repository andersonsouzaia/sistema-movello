import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingFallback } from "@/components/ui/LoadingFallback";

// Rotas públicas - carregamento imediato
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";

// Rotas públicas - lazy loading
const CadastroEmpresa = lazy(() => import("./pages/auth/CadastroEmpresa"));
const CadastroMotorista = lazy(() => import("./pages/auth/CadastroMotorista"));
const RecuperarSenha = lazy(() => import("./pages/auth/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/auth/RedefinirSenha"));
const ConfirmarEmail = lazy(() => import("./pages/auth/ConfirmarEmail"));
const CreateFirstAdmin = lazy(() => import("./pages/setup/CreateFirstAdmin"));

// Rotas Empresa - lazy loading
const EmpresaDashboard = lazy(() => import("./pages/empresa/Dashboard"));
const EmpresaCampanhas = lazy(() => import("./pages/empresa/Campanhas"));
const EmpresaNovaCampanha = lazy(() => import("./pages/empresa/Campanhas/Nova"));
const EmpresaCampanhaDetalhes = lazy(() => import("./pages/empresa/Campanhas/[id]"));
const EmpresaMidias = lazy(() => import("./pages/empresa/Midias"));
const EmpresaPagamentos = lazy(() => import("./pages/empresa/Pagamentos"));
const EmpresaPerfil = lazy(() => import("./pages/empresa/Perfil"));
const EmpresaSuporte = lazy(() => import("./pages/empresa/Suporte"));

// Rotas Motorista - lazy loading
const MotoristaDashboard = lazy(() => import("./pages/motorista/Dashboard"));
const MotoristaGanhos = lazy(() => import("./pages/motorista/Ganhos"));
const MotoristaTablet = lazy(() => import("./pages/motorista/Tablet"));
const MotoristaPerfil = lazy(() => import("./pages/motorista/Perfil"));
const MotoristaSuporte = lazy(() => import("./pages/motorista/Suporte"));

// Rotas Admin - lazy loading
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminEmpresas = lazy(() => import("./pages/admin/Empresas"));
const AdminEmpresaDetalhes = lazy(() => import("./pages/admin/Empresas/[id]"));
const AdminMotoristas = lazy(() => import("./pages/admin/Motoristas"));
const AdminMotoristaDetalhes = lazy(() => import("./pages/admin/Motoristas/[id]"));
const AdminCampanhas = lazy(() => import("./pages/admin/Campanhas"));
const AdminCampanhaDetalhes = lazy(() => import("./pages/admin/Campanhas/[id]"));
const AdminPagamentos = lazy(() => import("./pages/admin/Pagamentos"));
const AdminSuporte = lazy(() => import("./pages/admin/Suporte"));
const AdminTicketDetalhes = lazy(() => import("./pages/admin/Suporte/[id]"));
const AdminConfiguracoes = lazy(() => import("./pages/admin/Configuracoes"));
const AdminRoles = lazy(() => import("./pages/admin/Roles"));
const AdminRelatorios = lazy(() => import("./pages/admin/Relatorios"));
const AdminLogs = lazy(() => import("./pages/admin/Logs"));
const AdminNotificacoes = lazy(() => import("./pages/admin/Notificacoes"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/cadastro-empresa" 
                element={
                  <Suspense fallback={<LoadingFallback message="Carregando página..." />}>
                    <CadastroEmpresa />
                  </Suspense>
                } 
              />
              <Route 
                path="/cadastro-motorista" 
                element={
                  <Suspense fallback={<LoadingFallback message="Carregando página..." />}>
                    <CadastroMotorista />
                  </Suspense>
                } 
              />
              <Route 
                path="/recuperar-senha" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <RecuperarSenha />
                  </Suspense>
                } 
              />
              <Route 
                path="/redefinir-senha" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <RedefinirSenha />
                  </Suspense>
                } 
              />
              <Route 
                path="/confirmar-email" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ConfirmarEmail />
                  </Suspense>
                } 
              />
              <Route 
                path="/setup" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <CreateFirstAdmin />
                  </Suspense>
                } 
              />

              {/* Rotas Protegidas - Empresa */}
              <Route 
                path="/empresa/dashboard" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EmpresaDashboard />
                  </Suspense>
                } 
              />
              <Route 
                path="/empresa/campanhas" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EmpresaCampanhas />
                  </Suspense>
                } 
              />
              <Route 
                path="/empresa/campanhas/nova" 
                element={
                  <Suspense fallback={<LoadingFallback message="Carregando criação de campanha..." />}>
                    <EmpresaNovaCampanha />
                  </Suspense>
                } 
              />
              <Route 
                path="/empresa/campanhas/:id" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EmpresaCampanhaDetalhes />
                  </Suspense>
                } 
              />
              <Route 
                path="/empresa/midias" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EmpresaMidias />
                  </Suspense>
                } 
              />
              <Route 
                path="/empresa/pagamentos" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EmpresaPagamentos />
                  </Suspense>
                } 
              />
              <Route 
                path="/empresa/perfil" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EmpresaPerfil />
                  </Suspense>
                } 
              />
              <Route 
                path="/empresa/suporte" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <EmpresaSuporte />
                  </Suspense>
                } 
              />

              {/* Rotas Protegidas - Motorista */}
              <Route 
                path="/motorista/dashboard" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <MotoristaDashboard />
                  </Suspense>
                } 
              />
              <Route 
                path="/motorista/ganhos" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <MotoristaGanhos />
                  </Suspense>
                } 
              />
              <Route 
                path="/motorista/tablet" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <MotoristaTablet />
                  </Suspense>
                } 
              />
              <Route 
                path="/motorista/perfil" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <MotoristaPerfil />
                  </Suspense>
                } 
              />
              <Route 
                path="/motorista/suporte" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <MotoristaSuporte />
                  </Suspense>
                } 
              />

              {/* Rotas Protegidas - Admin */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminDashboard />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/empresas" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminEmpresas />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/empresas/:id" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminEmpresaDetalhes />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/motoristas" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminMotoristas />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/motoristas/:id" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminMotoristaDetalhes />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/campanhas" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminCampanhas />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/campanhas/:id" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminCampanhaDetalhes />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/pagamentos" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminPagamentos />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/suporte" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminSuporte />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/suporte/:id" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminTicketDetalhes />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/configuracoes" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminConfiguracoes />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/roles" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminRoles />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/relatorios" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminRelatorios />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/logs" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminLogs />
                  </Suspense>
                } 
              />
              <Route 
                path="/admin/notificacoes" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminNotificacoes />
                  </Suspense>
                } 
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
