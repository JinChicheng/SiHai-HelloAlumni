import { useEffect, useRef, useState } from 'react'
import { loadAMap } from '../lib/amap'
import { fetchStartups, fetchAlumniGrouped, AlumniItem } from '../lib/api'
import { Layers, Users, X } from 'lucide-react'

type Filters = {
  funding_stage?: string
  business_domain?: string
}

export default function StartupMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string>()
  const [ready, setReady] = useState(false)
  const [filters, setFilters] = useState<Filters>({})
  const [items, setItems] = useState<AlumniItem[]>([])
  const [selected, setSelected] = useState<AlumniItem | null>(null)
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [mode, setMode] = useState<'points' | 'groups'>('points')
  const [groups, setGroups] = useState<AlumniItem[]>([])
  const markers = useRef<any[]>([])
  const clusterRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const circlesRef = useRef<any[]>([])
  const [center, setCenter] = useState<[number, number]>([116.397428, 39.90923])

  useEffect(() => {
    let map: any
    loadAMap()
      .then((AMap) => {
        map = new AMap.Map(mapRef.current as HTMLDivElement, {
          viewMode: '2D',
          zoom: 5,
          center: [116.397428, 39.90923]
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
    fetchAndRender(filters)
  }, [ready, mode]) // Re-render when mode changes

  const clearLayers = () => {
    const map = mapInstanceRef.current
    if (!map) return
    if (clusterRef.current) { clusterRef.current.setMap(null); clusterRef.current = null }
    if (markers.current.length) { markers.current.forEach((m) => m.setMap && m.setMap(null)); markers.current = [] }
    if (circleRef.current) { circleRef.current.setMap(null); circleRef.current = null }
    if (circlesRef.current.length) { circlesRef.current.forEach((c) => c.setMap && c.setMap(null)); circlesRef.current = [] }
  }

  const renderPoints = (list: AlumniItem[]) => {
    const map = mapInstanceRef.current
    if (!map) return
    clearLayers()
    const AMap = (window as any).AMap
    const visibleList = list
    const ms = visibleList.filter(i => i.lat != null && i.lng != null).map(i => {
      const m = new AMap.Marker({
        position: [i.lng as number, i.lat as number],
        title: `${i.company || i.name}`,
        offset: new AMap.Pixel(-10, -24),
        extData: { id: i.id }
      })
      m.on('click', () => setSelected(i))
      return m
    })
    markers.current = ms
    clusterRef.current = new AMap.MarkerCluster(map, ms, { gridSize: 60 })
    if (ms.length) map.setFitView(ms)
    
    // Draw the search radius circle (removed, as we are global now)
  }

  const renderCircles = (groupsList: AlumniItem[]) => {
    const map = mapInstanceRef.current
    if (!map) return
    clearLayers()
    const AMap = (window as any).AMap
    
    const circles = groupsList.filter(g => g.lat != null && g.lng != null).map(g => {
      const radius = 5000 + ((g.virtual_count || 0) * 100); 
      
      const circle = new AMap.Circle({
        center: new AMap.LngLat(g.lng, g.lat),
        radius: radius,
        strokeColor: '#1677ff',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#1677ff',
        fillOpacity: 0.2
      })
      
      const label = new AMap.Text({
        text: `${g.industry}圈（${g.virtual_count}）`,
        position: new AMap.LngLat(g.lng, g.lat),
        style: { 'background': '#ffffff', 'padding': '4px 8px', 'borderRadius': '4px', 'border': '1px solid #eee' }
      })
      
      circle.setMap(map)
      label.setMap(map)
      
      circle.on('click', () => {
         map.setZoomAndCenter(10, new AMap.LngLat(g.lng, g.lat))
      })

      return { circle, label }
    })
    
    circlesRef.current = circles.flatMap(c => [c.circle, c.label])
    if (circles.length) map.setFitView(circles.map(c => c.circle))
  }

  const fetchAndRender = async (q: Record<string, any>) => {
    if (mode === 'groups') {
      const list = await fetchAlumniGrouped({ ...q, is_startup: '1', group_radius_km: 100 })
      setGroups(list)
      renderCircles(list)
    } else {
      const list = await fetchStartups(q)
      setItems(list)
      renderPoints(list)
    }
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value || undefined }
    setFilters(next)
    fetchAndRender(next)
  }

  const handleReset = () => {
    setFilters({})
    fetchAndRender({})
  }

  return (
    <div className="fullscreen-map-container">
      <header className="top-nav-bar">
        <div className="nav-left">
          <div className="brand-text">
            <div className="brand-title">校友创业企业地图</div>
            <div className="brand-subtitle">STARTUPS</div>
          </div>
        </div>
        <div className="nav-center">
          <div className="filter-group">
            <select className="nav-select" value={filters.funding_stage || ''} onChange={e => handleFilterChange('funding_stage', e.target.value)}>
              <option value="">全部融资阶段</option>
              <option value="天使轮">天使轮</option>
              <option value="种子轮">种子轮</option>
              <option value="Pre-A轮">Pre-A轮</option>
              <option value="A轮">A轮</option>
              <option value="A+轮">A+轮</option>
              <option value="B轮">B轮</option>
              <option value="C轮">C轮</option>
              <option value="D轮">D轮</option>
              <option value="IPO">IPO</option>
              <option value="不需要融资">不需要融资</option>
            </select>
            <select className="nav-select" value={filters.business_domain || ''} onChange={e => handleFilterChange('business_domain', e.target.value)}>
              <option value="">全部业务方向</option>
              <option value="AI">AI</option>
              <option value="SaaS">SaaS</option>
              <option value="教育科技">教育科技</option>
              <option value="金融科技">金融科技</option>
              <option value="电商">电商</option>
              <option value="企业服务">企业服务</option>
              <option value="医疗健康">医疗健康</option>
              <option value="智能硬件">智能硬件</option>
              <option value="社交娱乐">社交娱乐</option>
              <option value="自动驾驶">自动驾驶</option>
              <option value="机器人">机器人</option>
            </select>
            <button className="reset-btn" onClick={handleReset} title="重置筛选条件">
              重置
            </button>
          </div>
        </div>
      </header>
      <div id="map" ref={mapRef} />
      {mode === 'groups' && (
        <div className="floating-panel">
          <div className="panel-header">
            <span>行业圈子（100公里内）</span>
            <X size={16} style={{cursor:'pointer'}} onClick={() => setMode('points')} />
          </div>
          <div className="panel-body" style={{maxHeight: 260, overflowY: 'auto'}}>
            {groups.map((g, idx) => (
              <div key={`${g.industry}-${idx}`} className="list-item" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:600}}>{g.industry}</div>
                  <div style={{fontSize:12, color:'#666'}}>成员：{g.virtual_count}</div>
                </div>
                <button
                  className="control-btn"
                  onClick={() => {
                    const map = mapInstanceRef.current
                    const AMap = (window as any).AMap
                    if (map && g.lat && g.lng) {
                      map.setZoomAndCenter(10, new AMap.LngLat(g.lng, g.lat))
                    }
                  }}
                >
                  查看
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {selected && (
        <div className="floating-panel">
          <div className="panel-header">
            <span>{selected.company || selected.name}</span>
            <X size={16} style={{cursor:'pointer'}} onClick={() => setSelected(null)} />
          </div>
          <div className="panel-body">
            <div>业务方向：{selected.business_domain || '未知'}</div>
            <div>融资阶段：{selected.funding_stage || '未知'}</div>
            <div>联系人：{selected.contact_name || '未知'}</div>
            <div>电话：{selected.contact_phone || '未知'}</div>
            <div>邮箱：{selected.contact_email || '未知'}</div>
            <div>地址：{selected.address || selected.city}</div>
          </div>
        </div>
      )}
      <div className="floating-controls">
        <div className="control-group">
          <button className={`control-btn ${showLayerMenu ? 'active' : ''}`} onClick={() => setShowLayerMenu(!showLayerMenu)} title="图层">
            <Layers size={20} />
          </button>
          <button className={`control-btn ${mode === 'groups' ? 'active' : ''}`} onClick={() => setMode(mode === 'groups' ? 'points' : 'groups')} title="圈子">
            <Users size={20} />
          </button>
        </div>
      </div>
      {error && <div className="error-toast">{error}</div>}
    </div>
  )
}
