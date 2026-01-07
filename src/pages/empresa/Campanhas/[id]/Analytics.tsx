import { useParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useEmpresaCampanha } from '@/hooks/useEmpresaCampanhas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapContainer, TileLayer, Circle, Polygon } from 'react-leaflet'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { MapPin, TrendingUp, Eye, MousePointerClick, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'
import { useIsMobile } from '@/hooks/use-mobile'
import 'leaflet/dist/leaflet.css'

export default function CampanhaAnalytics() {
  const isMobile = useIsMobile()
  const { id } = useParams<{ id: string }>()
  const { campanha, loading, error } = useEmpresaCampanha(id || '')

  if (loading) {
    return (
      <ProtectedRoute requiredUserType="empresa">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando analytics...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !campanha) {
    return (
      <ProtectedRoute requiredUserType="empresa">
        <DashboardLayout>
          <Card className="card-premium border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error || 'Campanha não encontrada'}</p>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // Mock data para demonstração - em produção viria do backend
  const performancePorArea = [
    { area: 'Centro', visualizacoes: 1200, cliques: 45, conversoes: 5 },
    { area: 'Zona Norte', visualizacoes: 800, cliques: 30, conversoes: 3 },
    { area: 'Zona Sul', visualizacoes: 1500, cliques: 60, conversoes: 8 },
  ]

  const roiPorLocalizacao = [
    { localizacao: 'Raio 1km', investido: 500, retorno: 1200, roi: 140 },
    { localizacao: 'Raio 2km', investido: 800, retorno: 1800, roi: 125 },
    { localizacao: 'Raio 5km', investido: 1200, retorno: 2500, roi: 108 },
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <ProtectedRoute requiredUserType="empresa">
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">
              Analytics - {campanha.titulo}
            </h1>
            <p className="text-lg text-muted-foreground">
              Análise detalhada de performance geográfica
            </p>
          </div>

          {/* Mapa de Cobertura */}
          {campanha.localizacao_tipo && (
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Mapa de Cobertura
                </CardTitle>
                <CardDescription>
                  Visualização da área de cobertura da campanha
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campanha.localizacao_tipo === 'raio' && campanha.centro_latitude && campanha.centro_longitude && campanha.raio_km && (
                  <MapContainer
                    center={[campanha.centro_latitude, campanha.centro_longitude]}
                    zoom={13}
                    style={{ height: '400px', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Circle
                      center={[campanha.centro_latitude, campanha.centro_longitude]}
                      radius={campanha.raio_km * 1000}
                      pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
                    />
                  </MapContainer>
                )}
                {campanha.localizacao_tipo === 'poligono' && campanha.poligono_coordenadas && (
                  <MapContainer
                    bounds={campanha.poligono_coordenadas as any}
                    style={{ height: '400px', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Polygon
                      positions={campanha.poligono_coordenadas}
                      pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
                    />
                  </MapContainer>
                )}
              </CardContent>
            </Card>
          )}

          {/* Performance por Área */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Performance por Área</CardTitle>
              <CardDescription>
                Comparativo de métricas por região
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <BarChart data={performancePorArea}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="visualizacoes" fill="#3b82f6" name="Visualizações" />
                  <Bar dataKey="cliques" fill="#10b981" name="Cliques" />
                  <Bar dataKey="conversoes" fill="#f59e0b" name="Conversões" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ROI por Localização */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                ROI por Localização
              </CardTitle>
              <CardDescription>
                Retorno sobre investimento por área
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <BarChart data={roiPorLocalizacao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="localizacao" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="investido" fill="#ef4444" name="Investido" />
                  <Bar dataKey="retorno" fill="#10b981" name="Retorno" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Visualizações por Região
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                  <PieChart>
                    <Pie
                      data={performancePorArea}
                      dataKey="visualizacoes"
                      nameKey="area"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {performancePorArea.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5" />
                  Cliques por Região
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                  <PieChart>
                    <Pie
                      data={performancePorArea}
                      dataKey="cliques"
                      nameKey="area"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {performancePorArea.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Resumo de Alcance Geográfico */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Resumo de Alcance Geográfico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Área Total</p>
                  <p className="text-2xl font-bold">
                    {campanha.localizacao_tipo === 'raio' && campanha.raio_km
                      ? `${Math.PI * campanha.raio_km * campanha.raio_km} km²`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visualizações Totais</p>
                  <p className="text-2xl font-bold">3,500</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliques Totais</p>
                  <p className="text-2xl font-bold">135</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversões</p>
                  <p className="text-2xl font-bold">16</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

