import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Layers, Locate, MapPin, Users, Flame, X, ChevronDown, RefreshCw } from 'lucide-react'
import { loadAMap } from '../lib/amap'
import { fetchAlumni, fetchNearby, searchAlumniByLocation, AlumniItem, fetchMe, AlumniDetail } from '../lib/api'

// --- Types ---
type Filters = {
  college?: string
  major?: string
  grade?: string
  industry?: string
  industry_segment?: string
  poi?: string
}

export default function Map2D() {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string>()
  const [ready, setReady] = useState(false)
  
  // UI State
  const [mode, setMode] = useState<'points' | 'cluster' | 'heatmap'>('points')
  const [filters, setFilters] = useState<Filters>({})
  const [searchText, setSearchText] = useState('')
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [showResults, setShowResults] = useState(false) // Default hidden until search/click
  const [loading, setLoading] = useState(false)
  
  // Check if search text is a location query
  const isLocationQuery = /[\u4e00-\u9fa5]|北京|上海|广州|深圳|杭州|成都|武汉|西安|南京|天津|苏州|重庆|city|district|address/i.test(searchText)
  
  // Data State
  const [nearbyList, setNearbyList] = useState<AlumniItem[]>([])
  const [displayList, setDisplayList] = useState<AlumniItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<AlumniItem | null>(null)
  const [currentUser, setCurrentUser] = useState<AlumniDetail | null>(null)
  
  // Refs
  const markers = useRef<any[]>([])  
  const clusterRef = useRef<any>(null)
  const heatmapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const pluginsReadyRef = useRef<boolean>(false)
  const meMarkerRef = useRef<any>(null)
  
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

  // Fetch current user info
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await fetchMe()
        setCurrentUser(user)
      } catch (err) {
        console.log('Not logged in or error fetching user:', err)
      }
    }
    loadCurrentUser()
  }, [])

  // Initial Fetch - Optimized: Only fetch data when user interacts, not on initial load
  useEffect(() => {
    if (ready) {
      // Don't fetch all data on initial load to improve performance
      // Instead, wait for user to search or apply filters
      setLoading(false)
    }
  }, [ready])

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
    // Clear current user marker
    if (meMarkerRef.current) {
      meMarkerRef.current.setMap(null)
      meMarkerRef.current = null
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

  const resolveItemPosition = async (i: AlumniItem): Promise<[number, number] | null> => {
    if (i.lng != null && i.lat != null) return [i.lng as number, i.lat as number]
    const addr = i.district || i.city
    if (!addr) return null
    return await geocodeAddress(addr)
  }

  // --- Rendering ---
  const renderPoints = async (items: AlumniItem[]) => {
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
    const ms = validItems.map((i, idx) => {
      const pos = validPositions[idx]
      if (!pos) return null
      
      // Create marker element with simplified styling
      const el = document.createElement('div')
      el.className = 'bounce-marker'
      el.innerHTML = `
        <div class="bounce-marker-pin"></div>
        <div class="bounce-marker-pulse"></div>
      `
      
      const m = new AMap.Marker({
        position: pos,
        title: `${i.name}`,
        clickable: true,
        content: el,
        offset: new AMap.Pixel(-15, -30),
        extData: { id: i.id }
      })
      
      m.on('click', () => {
        setSelectedId(i.id)
        setSelectedItem(i)
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

  const renderHeatmap = (items: AlumniItem[]) => {
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

  const renderCurrentUserMarker = () => {
    if (!currentUser || !ready || !mapInstanceRef.current) return
    
    const AMap = (window as any).AMap
    if (!AMap) return
    
    // Only render if user has valid location
    const hasLocation = currentUser.lat != null && currentUser.lng != null
    if (!hasLocation) return
    
    const map = mapInstanceRef.current
    const pos = [currentUser.lng, currentUser.lat]
    
    // Create highlight marker for current user
    const el = document.createElement('div')
    el.className = 'me-marker'
    el.innerHTML = `
      <div class="highlight-marker">
          <div class="outer-ring"></div>
          <div class="inner-circle"></div>
        </div>
    `
    
    meMarkerRef.current = new AMap.Marker({
      position: pos,
      map: map,
      title: '我',
      content: el,
      offset: new AMap.Pixel(-20, -20),
      zIndex: 1000 // Ensure it's always on top
    })
  }

  const fetchAndRender = async (queryFilters: Record<string, any>) => {
    try {
      setLoading(true)
      const payload: Record<string, any> = { ...queryFilters }
      
      if (payload.poi) {
        if (isLocationQuery) {
          // Use fuzzy location search for location queries
          const locationFilters: Record<string, any> = {}
          if (payload.college) locationFilters.college = payload.college
          if (payload.major) locationFilters.major = payload.major
          if (payload.graduation_year) locationFilters.graduation_year = payload.graduation_year
          if (payload.industry) locationFilters.industry = payload.industry
          if (payload.industry_segment) locationFilters.industry_segment = payload.industry_segment
          
          const items = await searchAlumniByLocation(payload.poi, locationFilters)
          setNearbyList(items)
          setDisplayList(items)
          if (items.length > 0) {
            setShowResults(true)
          }
          if (mode === 'heatmap') renderHeatmap(items)
          else renderPoints(items)
          setLoading(false)
          return
        } else {
          // Check if it's a fuzzy search query (name, industry, company, etc.)
          // If it contains location keywords, use geocoding
          // Otherwise, use fuzzy search with keyword parameter
          const hasLocationKeywords = /北京|上海|广州|深圳|杭州|成都|武汉|西安|南京|天津|苏州|重庆|city|district|address/i.test(payload.poi)
          
          if (hasLocationKeywords) {
            // Use geocoding for address queries
            await ensurePlugins()
            const loc = await geocodeAddress(payload.poi)
            if (loc) {
              payload.lat = loc[1]
              payload.lng = loc[0]
              payload.radius_km = 10
            }
          } else {
            // Use fuzzy search for name, industry, company, etc.
            payload.keyword = payload.poi
            delete payload.poi
          }
        }
      }

      if (payload.grade) {
          payload.graduation_year = payload.grade
          delete payload.grade
      }

      const items = await fetchAlumni(payload)
      setNearbyList(items)
      setDisplayList(items)
      if (items.length > 0 && (payload.poi || payload.keyword || Object.keys(payload).length > 0)) {
          setShowResults(true)
      }

      if (mode === 'heatmap') renderHeatmap(items)
      else renderPoints(items)
      
      // Render current user highlight marker after other markers
      renderCurrentUserMarker()
      
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
    fetchAndRender({ ...newFilters, poi: searchText })
  }

  const handleSearch = () => {
    fetchAndRender({ ...filters, poi: searchText })
  }

  const handleReset = () => {
    setFilters({})
    setSearchText('')
    clearLayers()
    setNearbyList([])
    setShowResults(false)
    fetchAndRender({})
  }

  const handleModeChange = (m: 'points' | 'cluster' | 'heatmap') => {
      setMode(m)
      setTimeout(() => {
        fetchAndRender({ ...filters, poi: searchText })
      }, 0)
      setShowLayerMenu(false)
  }

  const locateUser = async () => {
    const AMap = (window as any).AMap
    if (!AMap) return
    setLoading(true)
    try {
      await ensurePlugins()
      const geolocation = new AMap.Geolocation({ enableHighAccuracy: true })
      geolocation.getCurrentPosition(async (status: string, result: any) => {
        if (status === 'complete') {
          const { position } = result
          const lng = position.lng, lat = position.lat
          
          const el = document.createElement('div')
          el.className = 'me-marker'
          el.innerHTML = '<div class="pulse"></div><div class="center"></div>'
          new AMap.Marker({ 
              position: [lng, lat], 
              map: mapInstanceRef.current, 
              title: '我', 
              content: el,
              offset: new AMap.Pixel(-12, -12)
          })

          mapInstanceRef.current.setZoomAndCenter(14, [lng, lat])
          
          const items = await fetchNearby(lat, lng, 10)
          setNearbyList(items)
          renderPoints(items)
          setShowResults(true)
        } else {
          setError('定位失败')
        }
        setLoading(false)
      })
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

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
      `}</style>
      {/* Top Navigation & Filter Bar */}
      <header className="top-nav-bar">
        <div className="nav-left">
          <div className="brand-text">
            <div className="brand-title">校友地图</div>
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
            <select className="nav-select" value={filters.college || ''} onChange={e => handleFilterChange('college', e.target.value)}>
              <option value="">全部学院</option>
              <option value="管理学院">管理学院</option>
              <option value="计算机系">计算机系</option>
              <option value="金融学院">金融学院</option>
              <option value="经管学院">经管学院</option>
              <option value="材料学院">材料学院</option>
              <option value="物理学院">物理学院</option>
              <option value="化学学院">化学学院</option>
              <option value="生命科学学院">生命科学学院</option>
              <option value="工程科学学院">工程科学学院</option>
              <option value="少年班学院">少年班学院</option>
            </select>
            <select className="nav-select" value={filters.major || ''} onChange={e => handleFilterChange('major', e.target.value)}>
              <option value="">全部专业</option>
              <option value="计算机">计算机</option>
              <option value="金融">金融</option>
              <option value="市场">市场</option>
              <option value="软件工程">软件工程</option>
              <option value="数据科学">数据科学</option>
              <option value="电子信息">电子信息</option>
              <option value="自动化">自动化</option>
              <option value="物理学">物理学</option>
              <option value="化学">化学</option>
              <option value="生物科学">生物科学</option>
              <option value="人工智能">人工智能</option>
              <option value="微电子">微电子</option>
            </select>
            <select className="nav-select" value={filters.grade || ''} onChange={e => handleFilterChange('grade', e.target.value)}>
              <option value="">全部年级</option>
              <option value="2000">2000级</option>
              <option value="2005">2005级</option>
              <option value="2010">2010级</option>
              <option value="2015">2015级</option>
              <option value="2020">2020级</option>
              <option value="2023">2023级</option>
            </select>
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
            <button className="reset-btn" onClick={handleReset} title="重置筛选条件">
              重置
            </button>
          </div>
        </div>
      </header>

      {/* Main Map */}
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
                               navigate(`/profile/${item.id}`)
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

      {/* Right Bottom Controls */}
      <div className="floating-controls">
        <div className="control-group">
           {showLayerMenu && (
             <div className="layer-menu">
               <div className={`layer-option ${mode === 'points' ? 'active' : ''}`} onClick={() => handleModeChange('points')}>
                 <MapPin size={16} /> <span>校友分布</span>
               </div>
               <div className={`layer-option ${mode === 'cluster' ? 'active' : ''}`} onClick={() => handleModeChange('cluster')}>
                 <Users size={16} /> <span>聚合概览</span>
               </div>
               <div className={`layer-option ${mode === 'heatmap' ? 'active' : ''}`} onClick={() => handleModeChange('heatmap')}>
                 <Flame size={16} /> <span>热力密度</span>
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
        <button className="control-btn" onClick={locateUser} title="定位">
          <Locate size={20} />
        </button>
      </div>

      {loading && <div className="loading-toast">加载中...</div>}
      {error && <div className="error-toast">{error} <X size={14} onClick={() => setError(undefined)}/></div>}
      {selectedItem && (
        <div className="floating-panel">
          <div className="panel-header">
            <span>{selectedItem.name}</span>
            <X size={16} style={{cursor:'pointer'}} onClick={() => setSelectedItem(null)} />
          </div>
          <div className="panel-body">
            <div>行业：{selectedItem.industry || '未知'}</div>
            <div>细分：{selectedItem.industry_segment || '未知'}</div>
            <div>公司：{selectedItem.company || '未知'}</div>
            <div>职位：{selectedItem.job_title || '未知'}</div>
            <div>地址：{selectedItem.address || selectedItem.district || selectedItem.city}</div>
          </div>
        </div>
      )}
    </div>
  )
}
