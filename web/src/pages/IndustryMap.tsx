import { useEffect, useRef, useState } from 'react'
import { loadAMap } from '../lib/amap'
import { fetchAlumni, fetchAlumniGrouped, searchAlumniByLocation, AlumniItem } from '../lib/api'
import { Layers, MapPin, Users, Flame, X, Search } from 'lucide-react'

type Filters = {
  industry?: string
  industry_segment?: string
}

export default function IndustryMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string>()
  const [mode, setMode] = useState<'points' | 'heatmap' | 'circle'>('points')
  const [filters, setFilters] = useState<Filters>({})
  const [searchText, setSearchText] = useState('')
  const [items, setItems] = useState<AlumniItem[]>([])
  const [selected, setSelected] = useState<AlumniItem | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [displayList, setDisplayList] = useState<AlumniItem[]>([])
  
  // Check if search text is a location query
  const isLocationQuery = /[\u4e00-\u9fa5]|北京|上海|广州|深圳|杭州|成都|武汉|西安|南京|天津|苏州|重庆|city|district|address/i.test(searchText)

  const markers = useRef<any[]>([])
  const heatmapRef = useRef<any>(null)
  const circlesRef = useRef<any[]>([])
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    let map: any
    loadAMap(['AMap.HeatMap'])
      .then((AMap) => {
        map = new AMap.Map(mapRef.current as HTMLDivElement, {
          viewMode: '2D',
          zoom: 5,
          center: [116.397428, 39.90923]
        })
        mapInstanceRef.current = map
        setReady(true)
      })
      .catch((e) => setError(e.message))
    return () => { if ((map as any)?.destroy) (map as any).destroy() }
  }, [])

  useEffect(() => {
    if (!ready) return
    fetchAndRender(filters)
  }, [ready, mode, filters, searchText])

  const clearLayers = () => {
    const map = mapInstanceRef.current
    if (!map) return
    if (heatmapRef.current) { heatmapRef.current.setMap(null); heatmapRef.current = null }
    if (markers.current.length) { markers.current.forEach((m) => m.setMap && m.setMap(null)); markers.current = [] }
    if (circlesRef.current.length) { circlesRef.current.forEach((c) => c.setMap && c.setMap(null)); circlesRef.current = [] }
  }

  const renderPoints = (list: AlumniItem[]) => {
    const map = mapInstanceRef.current
    if (!map) return
    clearLayers()
    const AMap = (window as any).AMap
    const ms = list.filter(i => i.lat != null && i.lng != null).map(i => {
      const m = new AMap.Marker({
        position: [i.lng as number, i.lat as number],
        title: `${i.name} - ${i.company || ''}`,
        offset: new AMap.Pixel(-10, -24),
        extData: { id: i.id }
      })
      m.on('click', () => setSelected(i))
      return m
    })
    markers.current = ms
    ms.forEach(m => m.setMap(map))
    if (ms.length) map.setFitView(ms)
  }

  const renderHeatmap = (list: AlumniItem[]) => {
    const map = mapInstanceRef.current
    if (!map) return
    clearLayers()
    heatmapRef.current = new (window as any).AMap.HeatMap(map, { radius: 25 })
    const data = list.filter(i => i.lat != null && i.lng != null).map(i => ({
      lng: i.lng as number, lat: i.lat as number, count: 1
    }))
    heatmapRef.current.setDataSet({ data })
  }

  const renderCircles = (list: AlumniItem[]) => {
    const map = mapInstanceRef.current
    if (!map) return
    clearLayers()
    const AMap = (window as any).AMap
    const radiusMeters = 100 * 1000
    const circles = list.filter(i => i.lat != null && i.lng != null).map(i => {
      const circle = new AMap.Circle({
        center: new AMap.LngLat(i.lng as number, i.lat as number),
        radius: radiusMeters,
        strokeColor: '#1677ff',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#1677ff',
        fillOpacity: 0.15
      })
      const label = new AMap.Text({
        text: `${i.industry || '行业圈'}（${i.virtual_count || 0}）`,
        position: new AMap.LngLat(i.lng as number, i.lat as number),
        style: { 'background': '#ffffff', 'padding': '4px 8px', 'borderRadius': '4px', 'border': '1px solid #eee' }
      })
      circle.setMap(map)
      label.setMap(map)
      return circle
    })
    circlesRef.current = circles
    if (circles.length) map.setFitView(circles)
  }

  const fetchAndRender = async (q: Record<string, any>) => {
    try {
      let list: AlumniItem[] = []
      let fullList: AlumniItem[] = []
      
      const payload: Record<string, any> = { ...q }
      
      if (searchText) {
        if (isLocationQuery) {
          // Use fuzzy location search for location queries
          const locationFilters: Record<string, any> = {}
          if (payload.industry) locationFilters.industry = payload.industry
          if (payload.industry_segment) locationFilters.industry_segment = payload.industry_segment
          
          const items = await searchAlumniByLocation(searchText, locationFilters)
          setItems(items)
          setDisplayList(items)
          if (items.length > 0) {
            setShowResults(true)
          }
          if (mode === 'heatmap') renderHeatmap(items)
          else if (mode === 'circle') renderCircles(items)
          else renderPoints(items)
          return
        } else {
          // Check if it's a fuzzy search query (name, industry, company, etc.)
          // If it contains location keywords, use geocoding
          // Otherwise, use fuzzy search with keyword parameter
          const hasLocationKeywords = /北京|上海|广州|深圳|杭州|成都|武汉|西安|南京|天津|苏州|重庆|city|district|address/i.test(searchText)
          
          if (hasLocationKeywords) {
            // For location queries, we'll use the existing searchAlumniByLocation
            const locationFilters: Record<string, any> = {}
            if (payload.industry) locationFilters.industry = payload.industry
            if (payload.industry_segment) locationFilters.industry_segment = payload.industry_segment
            
            const items = await searchAlumniByLocation(searchText, locationFilters)
            setItems(items)
            setDisplayList(items)
            if (items.length > 0) {
              setShowResults(true)
            }
            if (mode === 'heatmap') renderHeatmap(items)
            else if (mode === 'circle') renderCircles(items)
            else renderPoints(items)
            return
          } else {
            // Use fuzzy search for name, industry, company, etc.
            payload.keyword = searchText
          }
        }
      }
      
      if (mode === 'circle') {
        list = await fetchAlumniGrouped({ 
          industry: payload.industry, 
          industry_segment: payload.industry_segment, 
          group_radius_km: 100,
          keyword: payload.keyword
        })
        setItems(list)
        renderCircles(list)
        // 同时获取完整的校友列表用于展示
        fullList = await fetchAlumni({ ...payload, industry: payload.industry, industry_segment: payload.industry_segment })
      } else {
        fullList = await fetchAlumni({ ...payload, industry: payload.industry, industry_segment: payload.industry_segment })
        setItems(fullList)
        if (mode === 'heatmap') renderHeatmap(fullList)
        else renderPoints(fullList)
      }
      
      setDisplayList(fullList)
      setShowResults(fullList.length > 0)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value || undefined }
    setFilters(next)
    fetchAndRender(next)
  }

  const handleSearch = () => {
    fetchAndRender(filters)
  }

  const handleReset = () => {
    setFilters({})
    setSearchText('')
    fetchAndRender({})
  }

  return (
    <div className="fullscreen-map-container">
      <header className="top-nav-bar">
        <div className="nav-left">
          <div className="brand-text">
            <div className="brand-title">行业圈校友地图</div>
            <div className="brand-subtitle">INDUSTRY</div>
          </div>
        </div>

        <div className="nav-center">
            {/* Simple Search */}
            <div className="search-box">
                <Search size={16} className="search-icon" />
                <input 
                    placeholder="搜索校友或地点..." 
                    value={searchText} 
                    onChange={e => setSearchText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    title="搜索校友或地点"
                />
                {searchText && <X size={14} className="clear-icon" onClick={() => setSearchText('')} />}
            </div>
        </div>

        <div className="nav-right">
          <div className="filter-group">
            <select className="nav-select" value={filters.industry || ''} onChange={e => handleFilterChange('industry', e.target.value)}>
              <option value="">全部行业</option>
              <option value="互联网">互联网</option>
              <option value="金融">金融</option>
              <option value="制造">制造</option>
              <option value="教育">教育</option>
              <option value="咨询">咨询</option>
              <option value="医疗健康">医疗健康</option>
              <option value="新能源">新能源</option>
              <option value="人工智能">人工智能</option>
              <option value="半导体">半导体</option>
              <option value="企业服务">企业服务</option>
            </select>
            <select className="nav-select" value={filters.industry_segment || ''} onChange={e => handleFilterChange('industry_segment', e.target.value)}>
              <option value="">全部细分</option>
              {/* 金融 */}
              <option value="投行">金融 - 投行</option>
              <option value="券商">金融 - 券商</option>
              <option value="基金">金融 - 基金</option>
              <option value="银行">金融 - 银行</option>
              <option value="保险">金融 - 保险</option>
              <option value="信托">金融 - 信托</option>
              {/* 互联网 */}
              <option value="研发">互联网 - 研发</option>
              <option value="产品">互联网 - 产品</option>
              <option value="运营">互联网 - 运营</option>
              <option value="创业">互联网 - 创业</option>
              <option value="设计">互联网 - 设计</option>
              <option value="测试">互联网 - 测试</option>
              {/* 制造 */}
              <option value="研发">制造 - 研发</option>
              <option value="工艺">制造 - 工艺</option>
              <option value="供应链">制造 - 供应链</option>
              <option value="质量管理">制造 - 质量管理</option>
              {/* 教育 */}
              <option value="教研">教育 - 教研</option>
              <option value="培训">教育 - 培训</option>
              <option value="行政">教育 - 行政</option>
              <option value="K12">教育 - K12</option>
              {/* 咨询 */}
              <option value="管理咨询">咨询 - 管理咨询</option>
              <option value="战略咨询">咨询 - 战略咨询</option>
              <option value="IT咨询">咨询 - IT咨询</option>
              {/* 医疗健康 */}
              <option value="医生">医疗健康 - 医生</option>
              <option value="医药研发">医疗健康 - 医药研发</option>
              <option value="医疗器械">医疗健康 - 医疗器械</option>
              <option value="生物技术">医疗健康 - 生物技术</option>
              {/* 新能源 */}
              <option value="电池研发">新能源 - 电池研发</option>
              <option value="光伏">新能源 - 光伏</option>
              <option value="风电">新能源 - 风电</option>
              <option value="储能">新能源 - 储能</option>
              {/* 人工智能 */}
              <option value="算法">人工智能 - 算法</option>
              <option value="数据挖掘">人工智能 - 数据挖掘</option>
              <option value="NLP">人工智能 - NLP</option>
              <option value="CV">人工智能 - CV</option>
              <option value="大模型">人工智能 - 大模型</option>
              {/* 半导体 */}
              <option value="IC设计">半导体 - IC设计</option>
              <option value="封装测试">半导体 - 封装测试</option>
              <option value="设备制造">半导体 - 设备制造</option>
              {/* 企业服务 */}
              <option value="SaaS">企业服务 - SaaS</option>
              <option value="云服务">企业服务 - 云服务</option>
              <option value="网络安全">企业服务 - 网络安全</option>
            </select>
            <button className="reset-btn" onClick={handleReset} title="重置筛选条件">
              重置
            </button>
          </div>
        </div>
      </header>
      <div id="map" ref={mapRef} />

      {/* Floating Results List (Left) */}
      {showResults && displayList.length > 0 && (
        <div className="floating-results">
          <div className="results-header">
            <span>共找到 {displayList.length} 位校友</span>
            <X size={16} style={{cursor: 'pointer'}} onClick={() => setShowResults(false)} />
          </div>
          <div className="results-list">
            {displayList.map(item => {
              const locationText = [item.city, item.district, item.address].filter(Boolean).join(' · ')
              return (
                <div key={item.id} className={`result-item ${selectedId === item.id ? 'active' : ''}`} 
                  onClick={() => {
                    setSelectedId(item.id)
                    setSelected(item)
                  }}>
                  <div className="item-name">{item.name}</div>
                  <div className="item-info">{item.college} · {item.graduation_year}级</div>
                  <div className="item-sub">{item.industry} · {locationText || '位置未知'}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Floating Panel for Selected Alumni (Right) */}
      {selected && (
        <div className="floating-panel">
          <div className="panel-header">
            <span>{selected.name}</span>
            <X size={16} style={{cursor:'pointer'}} onClick={() => {
              setSelected(null)
              setSelectedId(null)
            }} />
          </div>
          <div className="panel-body">
            <div>公司：{selected.company || '未知'}</div>
            <div>行业：{selected.industry || '未知'}</div>
            <div>细分：{selected.industry_segment || '未知'}</div>
            <div>职位：{selected.job_title || '未知'}</div>
            <div>地址：{selected.address || selected.district || selected.city}</div>
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
              <div className={`layer-option ${mode === 'heatmap' ? 'active' : ''}`} onClick={() => setMode('heatmap')}>
                <Flame size={16} /> <span>热力</span>
              </div>
              <div className={`layer-option ${mode === 'circle' ? 'active' : ''}`} onClick={() => setMode('circle')}>
                <Users size={16} /> <span>圈层</span>
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
