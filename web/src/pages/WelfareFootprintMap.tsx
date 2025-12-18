import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Layers, MapPin, Users, Flame, X, RefreshCw, User, Globe } from 'lucide-react'
import { loadAMap } from '../lib/amap'
import { fetchUserWelfareFootprints, fetchAllWelfareFootprints, WelfareFootprint } from '../lib/api'

export default function WelfareFootprintMap() {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string>()
  const [ready, setReady] = useState(false)
  
  // UI State
  const [mode, setMode] = useState<'points' | 'cluster' | 'heatmap'>('points')
  const [searchText, setSearchText] = useState('')
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [footprintType, setFootprintType] = useState<'individual' | 'school'>('individual')
  
  // Data State
  const [footprints, setFootprints] = useState<WelfareFootprint[]>([])
  const [displayList, setDisplayList] = useState<WelfareFootprint[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<WelfareFootprint | null>(null)
  
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
        
        AMap.plugin(['AMap.MarkerCluster', 'AMap.HeatMap', 'AMap.Geocoder', 'AMap.ToolBar'], () => {
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
      AMap.plugin(['AMap.MarkerCluster', 'AMap.HeatMap', 'AMap.Geocoder'], () => {
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

  const fetchFootprints = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let fetchedFootprints: WelfareFootprint[] = []
      
      if (footprintType === 'individual') {
        // Get user ID from local storage or state (this would be implemented in a real app)
        const userId = 1 // Placeholder - in real app, get from authenticated user
        fetchedFootprints = await fetchUserWelfareFootprints(userId)
      } else {
        fetchedFootprints = await fetchAllWelfareFootprints()
      }
      
      setFootprints(fetchedFootprints)
      setDisplayList(fetchedFootprints)
      renderMap(fetchedFootprints)
    } catch (err) {
      setError('Failed to load footprints: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const renderMap = async (items: WelfareFootprint[]) => {
    const map = mapInstanceRef.current
    if (!map || !ready) return
    clearLayers()
    const AMap = (window as any).AMap
    
    // Optimize: Limit the number of markers to render for better performance
    const MAX_MARKERS = 200
    const renderItems = items.length > MAX_MARKERS ? items.slice(0, MAX_MARKERS) : items
    
    // Filter out items without valid positions first
    const validItems = renderItems.filter(i => i.lat != null && i.lng != null)
    
    if (mode === 'heatmap') {
      // Create heatmap with optimized parameters
      heatmapRef.current = new AMap.HeatMap(map, {
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
      return
    }
    
    // Create markers in a more efficient way
    const ms = validItems.map((item, idx) => {
      const pos = [item.lng as number, item.lat as number]
      if (!pos) return null
      
      // Create marker element with simplified styling
      const el = document.createElement('div')
      el.className = 'footprint-marker'
      el.innerHTML = `
        <div class="footprint-pin"></div>
        <div class="footprint-pulse"></div>
      `
      
      const m = new AMap.Marker({
        position: pos,
        title: `${item.project_title}`,
        clickable: true,
        content: el,
        offset: new AMap.Pixel(-15, -30),
        extData: { id: item.id }
      })
      
      m.on('click', () => {
        setSelectedId(item.id)
        setSelectedItem(item)
        setDisplayList(items) // Show all items in the list
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

  const handleSearch = () => {
    if (!searchText) {
      setDisplayList(footprints)
      renderMap(footprints)
      return
    }
    
    const filtered = footprints.filter(item => 
      item.project_title?.includes(searchText) ||
      item.participation_type.includes(searchText) ||
      item.description?.includes(searchText)
    )
    setDisplayList(filtered)
    renderMap(filtered)
    setShowResults(true)
  }

  const handleReset = () => {
    setSearchText('')
    clearLayers()
    setFootprints([])
    setDisplayList([])
    setShowResults(false)
    setSelectedId(null)
    setSelectedItem(null)
    fetchFootprints()
  }

  const handleModeChange = (m: 'points' | 'cluster' | 'heatmap') => {
      setMode(m)
      setTimeout(() => {
        renderMap(footprints)
      }, 0)
      setShowLayerMenu(false)
  }

  const handleFootprintTypeChange = (type: 'individual' | 'school') => {
    setFootprintType(type)
    setSelectedId(null)
    setSelectedItem(null)
    fetchFootprints()
  }

  // Initial fetch when map is ready
  useEffect(() => {
    if (ready) {
      fetchFootprints()
    }
  }, [ready, footprintType])

  return (
    <div className="fullscreen-map-container">
      <style>{`
        .footprint-marker {
          position: relative;
          width: 30px;
          height: 30px;
        }
        
        .footprint-pin {
          width: 20px;
          height: 20px;
          background-color: #fa8c16;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 8px rgba(250, 140, 22, 0.4);
        }
        
        .footprint-pulse {
          width: 30px;
          height: 30px;
          border: 2px solid #fa8c16;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 2s infinite;
          opacity: 0;
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
        
        .cluster-marker {
          background: rgba(24, 144, 255, 0.8);
          color: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
        }
      `}</style>
      {/* Top Navigation & Filter Bar */}
      <header className="top-nav-bar">
        <div className="nav-left">
          <div className="brand-text">
            <div className="brand-title">校友公益足迹</div>
            <div className="brand-subtitle">WELFARE FOOTPRINTS</div>
          </div>
        </div>

        <div className="nav-center">
            {/* Map Type Switch */}
            <div className="filter-group">
                <select 
                  className="nav-select" 
                  value={footprintType} 
                  onChange={e => handleFootprintTypeChange(e.target.value as 'individual' | 'school')}
                >
                    <option value="individual">个人足迹</option>
                    <option value="school">全校足迹</option>
                </select>
            </div>
            
            <div className="nav-divider"></div>

            {/* Search */}
            <div className="search-box">
                <Search size={16} className="search-icon" />
                <input 
                    placeholder="搜索项目名称、参与类型..." 
                    value={searchText} 
                    onChange={e => setSearchText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    title="支持模糊搜索：输入项目名称、参与类型等信息"
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
                  <span>共找到 {displayList.length} 条{footprintType === 'individual' ? '个人公益' : '全校公益'}足迹</span>
                  <X size={16} style={{cursor: 'pointer'}} onClick={() => setShowResults(false)} />
              </div>
              <div className="results-list">
                  {displayList.map(item => {
                    return (
                      <div key={item.id} className={`result-item ${selectedId === item.id ? 'active' : ''}`}
                           onClick={() => {
                               setSelectedId(item.id)
                               setSelectedItem(item)
                           }}>
                          <div className="item-name">{item.project_title}</div>
                          <div className="item-info">参与方式：{item.participation_type}</div>
                          <div className="item-sub">参与日期：{item.participation_date}</div>
                          {footprintType === 'school' && item.user_name && (
                            <div className="item-user">参与人：{item.user_name}</div>
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
                 <MapPin size={16} /> <span>足迹点位</span>
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
        <div className="control-group footprint-type-toggle">
          <button 
            className={`control-btn ${footprintType === 'individual' ? 'active' : ''}`}
            onClick={() => handleFootprintTypeChange('individual')}
            title="个人足迹"
          >
            <User size={20} />
          </button>
          <button 
            className={`control-btn ${footprintType === 'school' ? 'active' : ''}`}
            onClick={() => handleFootprintTypeChange('school')}
            title="全校足迹"
          >
            <Globe size={20} />
          </button>
        </div>
      </div>

      {loading && <div className="loading-toast">加载中...</div>}
      {error && <div className="error-toast">{error} <X size={14} onClick={() => setError(undefined)}/></div>}
      {selectedItem && (
        <div className="floating-panel">
          <div className="panel-header">
            <span>{selectedItem.project_title}</span>
            <X size={16} style={{cursor:'pointer'}} onClick={() => setSelectedItem(null)} />
          </div>
          <div className="panel-body">
            <div>参与日期：{selectedItem.participation_date}</div>
            <div>参与方式：{selectedItem.participation_type}</div>
            {selectedItem.description && <div>描述：{selectedItem.description}</div>}
            {footprintType === 'school' && selectedItem.user_name && <div>参与人：{selectedItem.user_name}</div>}
            <div>创建时间：{new Date(selectedItem.created_at).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}