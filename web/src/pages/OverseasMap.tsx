import { useEffect, useRef, useState } from 'react'
import { loadAMap } from '../lib/amap'
import { fetchOverseas, AlumniItem } from '../lib/api'
import { Layers, MapPin, Users, X } from 'lucide-react'

export default function OverseasMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string>()
  const [ready, setReady] = useState(false)
  const [country, setCountry] = useState<string>('')
  const [mode, setMode] = useState<'points' | 'cluster'>('cluster')
  const [groups, setGroups] = useState<Record<string, Record<string, AlumniItem[]>>>({})
  const [selected, setSelected] = useState<AlumniItem | null>(null)
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const markers = useRef<any[]>([])
  const clusterRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    let map: any
    loadAMap()
      .then((AMap) => {
        map = new AMap.Map(mapRef.current as HTMLDivElement, {
          viewMode: '2D',
          zoom: 3,
          center: [100, 30] // world-ish
        })
        mapInstanceRef.current = map
        setReady(true)
        AMap.plugin(['AMap.MarkerCluster'], () => {})
      })
      .catch((e) => setError(e.message))
    return () => { if ((map as any)?.destroy) (map as any).destroy() }
  }, [])

  useEffect(() => {
    if (!ready) return
    fetchAndRender(country)
  }, [ready, country, mode])

  const clearLayers = () => {
    const map = mapInstanceRef.current
    if (!map) return
    if (clusterRef.current) { clusterRef.current.setMap(null); clusterRef.current = null }
    if (markers.current.length) { markers.current.forEach((m) => m.setMap && m.setMap(null)); markers.current = [] }
  }

  const renderMarkers = (items: AlumniItem[]) => {
    const map = mapInstanceRef.current
    if (!map) return
    clearLayers()
    const AMap = (window as any).AMap
    const ms = items.filter(i => i.lat != null && i.lng != null).map(i => {
      const m = new AMap.Marker({
        position: [i.lng as number, i.lat as number],
        title: `${i.name} - ${i.city || ''}`,
        offset: new AMap.Pixel(-10, -24),
        extData: { id: i.id }
      })
      m.on('click', () => setSelected(i))
      return m
    })
    markers.current = ms
    if (mode === 'cluster') {
      clusterRef.current = new AMap.MarkerCluster(map, ms, { gridSize: 80 })
    } else {
      ms.forEach(m => m.setMap(map))
    }
    if (ms.length) map.setFitView(ms)
  }

  const fetchAndRender = async (c?: string) => {
    const g = await fetchOverseas(c || undefined)
    setGroups(g)
    const flat = Object.values(g).flatMap(cityMap => Object.values(cityMap).flat())
    renderMarkers(flat)
  }

  return (
    <div className="fullscreen-map-container">
      <header className="top-nav-bar">
        <div className="nav-left">
          <div className="brand-text">
            <div className="brand-title">海外校友地图</div>
            <div className="brand-subtitle">OVERSEAS</div>
          </div>
        </div>
        <div className="nav-center">
          <div className="filter-group">
            <select className="nav-select" value={country} onChange={e => setCountry(e.target.value)}>
              <option value="">全部国家</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Germany">Germany</option>
              <option value="Japan">Japan</option>
              <option value="Singapore">Singapore</option>
            </select>
          </div>
        </div>
      </header>
      <div id="map" ref={mapRef} />
      {selected && (
        <div className="floating-panel">
          <div className="panel-header">
            <span>{selected.name}</span>
            <X size={16} style={{cursor:'pointer'}} onClick={() => setSelected(null)} />
          </div>
          <div className="panel-body">
            <div>国家：{selected.country || '未知'}</div>
            <div>城市：{selected.city || '未知'}</div>
            <div>地址（英文）：{selected.address_en || '未知'}</div>
            <div>院校/专业：{selected.college} · {selected.major}</div>
          </div>
        </div>
      )}
      <div className="floating-controls">
        <div className="control-group">
          {showLayerMenu && (
            <div className="layer-menu">
              <div className={`layer-option ${mode === 'points' ? 'active' : ''}`} onClick={() => setMode('points')}>
                <MapPin size={16} /> <span>点位</span>
              </div>
              <div className={`layer-option ${mode === 'cluster' ? 'active' : ''}`} onClick={() => setMode('cluster')}>
                <Users size={16} /> <span>聚合</span>
              </div>
            </div>
          )}
          <button className={`control-btn ${showLayerMenu ? 'active' : ''}`} onClick={() => setShowLayerMenu(!showLayerMenu)} title="图层">
            <Layers size={20} />
          </button>
        </div>
      </div>
      {error && <div className="error-toast">{error}</div>}
    </div>
  )
}
