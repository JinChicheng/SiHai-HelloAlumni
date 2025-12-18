import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Layers, MapPin, Users, Flame, X, ChevronDown, RefreshCw } from 'lucide-react'
import { loadAMap } from '../lib/amap'
import { fetchWelfareProjects, WelfareProject, fetchWelfareTeams, WelfareTeam, fetchAllWelfareFootprints, WelfareFootprint } from '../lib/api'

// --- Types ---
type Filters = {
  project_type?: string
  city?: string
  district?: string
}

export default function WelfareMap() {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string>()
  const [ready, setReady] = useState(false)
  
  // UI State
  const [mode, setMode] = useState<'points' | 'cluster' | 'heatmap'>('points')
  const [filters, setFilters] = useState<Filters>({})
  const [searchText, setSearchText] = useState('')
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mapType, setMapType] = useState<'projects' | 'teams' | 'footprints'>('projects')
  
  // Data State
  const [projects, setProjects] = useState<WelfareProject[]>([])
  const [teams, setTeams] = useState<WelfareTeam[]>([])
  const [footprints, setFootprints] = useState<WelfareFootprint[]>([])
  const [displayList, setDisplayList] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  // Refs
  const markers = useRef<any[]>([])
  const clusterRef = useRef<any>(null)
  const heatmapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const pluginsReadyRef = useRef<boolean>(false)
  
  // Caches for performance optimization
  const geocodeCache = useRef<Map<string, [number, number]>>(new Map())

  // --- Map Initialization ---
  useEffect(() => {
    let map: any
    loadAMap()
      .then((AMap) => {
        map = new AMap.Map(mapRef.current as HTMLDivElement, {
          viewMode: '2D',
          zoom: 4,
          center: [116.397428, 39.90923],
          mapStyle: 'amap://styles/whitesmoke'
        })
        setReady(true)
        mapInstanceRef.current = map
        
        AMap.plugin(['AMap.MarkerCluster', 'AMap.HeatMap', 'AMap.Geolocation', 'AMap.Geocoder', 'AMap.ToolBar'], () => {
          pluginsReadyRef.current = true
        })
      })
      .catch((e) => setError(e.message))
    return () => {
      if ((map as any)?.destroy) (map as any).destroy()
    }
  }, [])

  // --- Map Helpers ---
  const ensurePlugins = async () => {
    const AMap = (window as any).AMap
    if (!AMap) throw new Error('AMap 尚未加载')
    if (pluginsReadyRef.current) return
    await new Promise<void>((resolve) => {
      AMap.plugin(['AMap.MarkerCluster', 'AMap.HeatMap', 'AMap.Geolocation', 'AMap.Geocoder'], () => {
        pluginsReadyRef.current = true
        resolve()
      })
    })
  }

  const clearLayers = () => {
    const map = mapInstanceRef.current
    if (!map) return
    if (clusterRef.current) {
      clusterRef.current.setMap(null)
      clusterRef.current = null
    }
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null)
      heatmapRef.current = null
    }
    if (markers.current.length) {
      markers.current.forEach((m) => m.setMap && m.setMap(null))
      markers.current = []
    }
  }

  const geocodeAddress = (text: string): Promise<[number, number] | null> => {
    // Check cache first to avoid repeated requests
    if (geocodeCache.current.has(text)) {
      return Promise.resolve(geocodeCache.current.get(text) || null)
    }
    
    return new Promise(async (resolve) => {
      const AMap = (window as any).AMap
      if (!AMap) return resolve(null)
      await ensurePlugins()
      const geocoder = new AMap.Geocoder({ city: '全国' })
      geocoder.getLocation(text, (status: string, result: any) => {
        if (status === 'complete' && result?.geocodes?.length) {
          const loc = result.geocodes[0].location
          const coords: [number, number] = [loc.lng, loc.lat]
          // Cache the result for future use
          geocodeCache.current.set(text, coords)
          resolve(coords)
        } else {
          resolve(null)
        }
      })
    })
  }

  const resolveItemPosition = async (item: any): Promise<[number, number] | null> => {
    if (item.lng != null && item.lat != null) return [item.lng as number, item.lat as number]
    const addr = item.address || item.location_name || item.meet_location
    if (!addr) return null
    return await geocodeAddress(addr)
  }

  // --- Rendering ---
  const renderPoints = async (items: any[]) => {
    const map = mapInstanceRef.current
    if (!map) return
    clearLayers()
    const AMap = (window as any).AMap
    
    // Optimize: Limit the number of markers to render for better performance
    const MAX_MARKERS = 200
    const renderItems = items.length > MAX_MARKERS ? items.slice(0, MAX_MARKERS) : items
    
    // Batch resolve positions with Promise.all for better performance
    const positions = await Promise.all(renderItems.map(resolveItemPosition))
    
    // Filter out items without valid positions first
    const validItems = renderItems.filter((_, idx) => positions[idx] !== null)
    const validPositions = positions.filter(pos => pos !== null) as [number, number][]
    
    // Create markers in a more efficient way
    const ms = validItems.map((item, idx) => {
      const pos = validPositions[idx]
      if (!pos) return null
      
      // Create marker element with simplified styling
      const el = document.createElement('div')
      el.className = 'bounce-marker welfare-marker'
      el.innerHTML = `
        <div class="bounce-marker-pin"></div>
        <div class="bounce-marker-pulse"></div>
      `
      
      const m = new AMap.Marker({
        position: pos,
        title: `${item.title}`,
        clickable: true,
        content: el,
        offset: new AMap.Pixel(-15, -30),
        extData: { id: item.id, type: mapType }
      })
      
      m.on('click', () => {
        setSelectedId(item.id)
        setSelectedItem(item)
        setDisplayList(items) // Show all items in the list, but only render limited markers
        map.setZoomAndCenter(15, pos)
        setShowResults(true)
      })
      
      return m
    }).filter(Boolean) as any[]
    
    markers.current = ms
    
    if (mode === 'cluster') {
        // Use marker clustering for better performance with many markers
        clusterRef.current = new AMap.MarkerCluster(map, ms, {
          gridSize: 60,
          maxZoom: 15,
          renderClusterMarker: (context: any) => {
            // Custom cluster marker for better performance
            const clusterEl = document.createElement('div')
            clusterEl.className = 'cluster-marker'
            clusterEl.innerHTML = `<span>${context.count}</span>`
            return clusterEl
          }
        })
    } else {
        // Add markers to map in batch for better performance
        map.add(ms)
    }
    
    if (ms.length && !selectedId) {
      // Set fit view with animation disabled for better performance
      map.setFitView(ms, {
        animate: false,
        includeGeometry: true
      })
    }
  }

  const renderHeatmap = (items: any[]) => {
    const map = mapInstanceRef.current
    if (!map) return
    clearLayers()
    
    // Optimize: Limit the number of data points for heatmap
    const MAX_HEATMAP_POINTS = 500
    const heatmapItems = items.length > MAX_HEATMAP_POINTS ? items.slice(0, MAX_HEATMAP_POINTS) : items
    
    // Pre-filter items with valid coordinates
    const validItems = heatmapItems.filter(i => i.lat != null && i.lng != null)
    
    // Create heatmap with optimized parameters
    heatmapRef.current = new (window as any).AMap.HeatMap(map, {
      radius: 25,
      opacity: [0, 0.8],
      gradient: {
        0.5: 'blue',
        0.7: 'yellow',
        0.9: 'red'
      }
    })
    
    // Create heatmap data efficiently
    const data = validItems.map(i => ({
      lng: i.lng as number,
      lat: i.lat as number,
      count: 1
    }))
    
    // Set data in one go for better performance
    heatmapRef.current.setDataSet({ data })
  }

  const fetchAndRender = async (queryFilters: Record<string, any>) => {
    try {
      setLoading(true)
      
      let items: any[] = []
      
      if (mapType === 'projects') {
        const fetchedProjects = await fetchWelfareProjects(queryFilters)
        setProjects(fetchedProjects)
        items = fetchedProjects
      } else if (mapType === 'teams') {
        const fetchedTeams = await fetchWelfareTeams()
        setTeams(fetchedTeams)
        items = fetchedTeams
      } else if (mapType === 'footprints') {
        const fetchedFootprints = await fetchAllWelfareFootprints()
        setFootprints(fetchedFootprints)
        items = fetchedFootprints
      }
      
      setDisplayList(items)
      if (items.length > 0 && (queryFilters.project_type || queryFilters.city || queryFilters.district)) {
        setShowResults(true)
      }

      if (mode === 'heatmap') renderHeatmap(items)
      else renderPoints(items)
      
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers ---
  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    fetchAndRender(newFilters)
  }

  const handleSearch = () => {
    fetchAndRender({ ...filters, address: searchText })
  }

  const handleReset = () => {
    setFilters({})
    setSearchText('')
    clearLayers()
    setProjects([])
    setTeams([])
    setFootprints([])
    setShowResults(false)
    setSelectedId(null)
    setSelectedItem(null)
  }

  const handleModeChange = (m: 'points' | 'cluster' | 'heatmap') => {
      setMode(m)
      setTimeout(() => {
        fetchAndRender(filters)
      }, 0)
      setShowLayerMenu(false)
  }

  const handleMapTypeChange = (type: 'projects' | 'teams' | 'footprints') => {
    setMapType(type)
    setSelectedId(null)
    setSelectedItem(null)
    fetchAndRender(filters)
  }

  // Initial fetch when map is ready
  useEffect(() => {
    if (ready) {
      fetchAndRender({})
    }
  }, [ready, mapType])

  return (
    <div className="fullscreen-map-container">
      <style>{`
        .highlight-marker {
          position: relative;
          width: 40px;
          height: 40px;
        }
        
        .highlight-marker .outer-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          border: 3px solid #1890ff;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 2s infinite;
          box-sizing: border-box;
        }
        
        .highlight-marker .inner-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 24px;
          height: 24px;
          background: rgba(24, 144, 255, 0.9);
          border: 3px solid white;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 10px rgba(24, 144, 255, 0.8);
        }
        
        .highlight-marker .center-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
        
        .welfare-marker .bounce-marker-pin {
          background-color: #52c41a;
        }
      `}</style>
      {/* Top Navigation & Filter Bar */}
      <header className="top-nav-bar">
        <div className="nav-left">
          <div className="brand-text">
            <div className="brand-title">校友公益地图</div>
            <div className="brand-subtitle">WELFARE</div>
          </div>
        </div>

        <div className="nav-center">
            {/* Map Type Switch */}
            <div className="filter-group">
                <select className="nav-select" value={mapType} onChange={e => handleMapTypeChange(e.target.value as any)}>
                    <option value="projects">公益项目</option>
                    <option value="teams">公益组队</option>
                    <option value="footprints">公益足迹</option>
                </select>
                <select className="nav-select" value={filters.project_type || ''} onChange={e => handleFilterChange('project_type', e.target.value)}>
                    <option value="">全部类型</option>
                    <option value="支教">支教</option>
                    <option value="助农">助农</option>
                    <option value="环保">环保</option>
                    <option value="献血">献血</option>
                    <option value="其他">其他</option>
                </select>
                <select className="nav-select" value={filters.city || ''} onChange={e => handleFilterChange('city', e.target.value)}>
                    <option value="">全部城市</option>
                    <option value="北京">北京</option>
                    <option value="上海">上海</option>
                    <option value="广州">广州</option>
                    <option value="深圳">深圳</option>
                    <option value="成都">成都</option>
                    <option value="丽江">丽江</option>
                    <option value="定西">定西</option>
                </select>
                <select className="nav-select" value={filters.district || ''} onChange={e => handleFilterChange('district', e.target.value)}>
                    <option value="">全部地区</option>
                    <option value="浦东">浦东</option>
                    <option value="其他">其他</option>
                </select>
            </div>
            
            <div className="nav-divider"></div>

            {/* Search */}
            <div className="search-box">
                <Search size={16} className="search-icon" />
                <input 
                    placeholder="搜索地点（如：北京、上海浦东、深圳南山）或项目名称..." 
                    value={searchText} 
                    onChange={e => setSearchText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    title="支持模糊搜索：输入城市、区县、街道等地点信息，或项目名称"
                />
                {searchText && <X size={14} className="clear-icon" onClick={() => setSearchText('')} />}
            </div>

            <button className="nav-btn-icon" title="刷新/重置" onClick={handleReset}>
                <RefreshCw size={16} />
            </button>
        </div>
      </header>

      {/* Main Map */}
      <div id="map" ref={mapRef} />

      {/* Floating Results List (Left) */}
      {showResults && displayList.length > 0 && (
          <div className="floating-results">
              <div className="results-header">
                  <span>共找到 {displayList.length} 个{mapType === 'projects' ? '公益项目' : mapType === 'teams' ? '公益队伍' : '公益足迹'}</span>
                  <X size={16} style={{cursor: 'pointer'}} onClick={() => setShowResults(false)} />
              </div>
              <div className="results-list">
                  {displayList.map(item => {
                    const locationText = item.address || item.location_name || item.meet_location || '位置未知'
                    return (
                      <div key={item.id} className={`result-item ${selectedId === item.id ? 'active' : ''}`}
                           onClick={() => {
                               setSelectedId(item.id)
                               setSelectedItem(item)
                           }}>
                          <div className="item-name">{item.title || item.project_title}</div>
                          {mapType === 'projects' && (
                            <>
                              <div className="item-info">类型：{item.project_type}</div>
                              <div className="item-sub">地点：{locationText}</div>
                            </>
                          )}
                          {mapType === 'teams' && (
                            <>
                              <div className="item-info">项目：{item.title}</div>
                              <div className="item-sub">集合地点：{locationText}</div>
                            </>
                          )}
                          {mapType === 'footprints' && (
                            <>
                              <div className="item-info">项目：{item.project_title}</div>
                              <div className="item-sub">参与日期：{item.participation_date}</div>
                            </>
                          )}
                      </div>
                    )
                  })}
              </div>
          </div>
      )}

      {/* Right Bottom Controls */}
      <div className="floating-controls">
        <div className="control-group">
           {showLayerMenu && (
             <div className="layer-menu">
               <div className={`layer-option ${mode === 'points' ? 'active' : ''}`} onClick={() => handleModeChange('points')}>
                 <MapPin size={16} /> <span>公益点位</span>
               </div>
               <div className={`layer-option ${mode === 'cluster' ? 'active' : ''}`} onClick={() => handleModeChange('cluster')}>
                 <Users size={16} /> <span>聚合概览</span>
               </div>
               <div className={`layer-option ${mode === 'heatmap' ? 'active' : ''}`} onClick={() => handleModeChange('heatmap')}>
                 <Flame size={16} /> <span>热力分布</span>
               </div>
             </div>
           )}
           <button 
             className={`control-btn ${showLayerMenu ? 'active' : ''}`}
             onClick={() => setShowLayerMenu(!showLayerMenu)}
             title="图层"
           >
             <Layers size={20} />
           </button>
        </div>
      </div>

      {loading && <div className="loading-toast">加载中...</div>}
      {error && <div className="error-toast">{error} <X size={14} onClick={() => setError(undefined)}/></div>}
      {selectedItem && (
        <div className="floating-panel">
          <div className="panel-header">
            <span>{selectedItem.title || selectedItem.project_title}</span>
            <X size={16} style={{cursor:'pointer'}} onClick={() => setSelectedItem(null)} />
          </div>
          <div className="panel-body">
            {mapType === 'projects' && (
              <>
                <div>类型：{selectedItem.project_type}</div>
                <div>描述：{selectedItem.description || '无'}</div>
                <div>地点：{selectedItem.address || selectedItem.location_name || '未知'}</div>
                <div>联系人：{selectedItem.contact_name || '未知'}</div>
                <div>联系电话：{selectedItem.contact_phone || '未知'}</div>
                {selectedItem.contact_email && <div>联系邮箱：{selectedItem.contact_email}</div>}
              </>
            )}
            {mapType === 'teams' && (
              <>
                <div>项目ID：{selectedItem.project_id}</div>
                <div>描述：{selectedItem.description || '无'}</div>
                <div>开始时间：{selectedItem.start_time}</div>
                {selectedItem.end_time && <div>结束时间：{selectedItem.end_time}</div>}
                <div>集合地点：{selectedItem.meet_location || '未知'}</div>
              </>
            )}
            {mapType === 'footprints' && (
              <>
                <div>项目：{selectedItem.project_title || '未知'}</div>
                <div>参与方式：{selectedItem.participation_type}</div>
                <div>参与日期：{selectedItem.participation_date}</div>
                <div>描述：{selectedItem.description || '无'}</div>
                {selectedItem.user_name && <div>参与人：{selectedItem.user_name}</div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}