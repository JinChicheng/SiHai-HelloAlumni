import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProjects, ProjectItem } from '../lib/api'
import { loadAMap } from '../lib/amap'
import { Plus, Share2, Phone } from 'lucide-react'

export default function ProjectMap() {
  const navigate = useNavigate()
  const mapContainer = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [nearbyProjects, setNearbyProjects] = useState<ProjectItem[]>([])
  const [filterStage, setFilterStage] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<string>('desc')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const markersRef = useRef<any[]>([])

  // Load Map
  useEffect(() => {
    loadAMap(['AMap.Geolocation', 'AMap.ToolBar']).then((AMap) => {
       if (!mapContainer.current) return
       const m = new AMap.Map(mapContainer.current, {
         zoom: 11,
         center: [104.066541, 30.572269]
       })
       m.addControl(new AMap.ToolBar())
       setMap(m)
       
       // Geolocation
       const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        buttonPosition: 'RB',
        buttonOffset: new AMap.Pixel(10, 20),
        zoomToAccuracy: true
       })
       m.addControl(geolocation)
       geolocation.getCurrentPosition((status: string, result: any) => {
         if (status === 'complete') {
            const { lat, lng } = result.position
            setUserLocation({ lat, lng })
            // Fetch nearby projects
            fetchProjects({ lat, lng, radius_km: 3, status: 'approved' }).then(setNearbyProjects)
         }
       })
    }).catch(e => console.error(e))
  }, [])

  // Fetch all projects when filter, sort or search changes
  useEffect(() => {
    fetchProjects({ 
      status: 'approved',
      funding_stage: filterStage, 
      sort_by: sortBy as 'created_at' | 'funding_stage', 
      order: sortOrder as 'asc' | 'desc',
      search: searchQuery
    }).then(data => {
        setProjects(data)
    })
  }, [filterStage, sortBy, sortOrder, searchQuery])

  // Update markers
  useEffect(() => {
    if (!map || !projects.length) return
    
    // Clear existing
    map.remove(markersRef.current)
    markersRef.current = []

    const AMap = (window as any).AMap

    projects.forEach(project => {
      // Define color based on funding stage
      let color = 'blue';
      if (project.funding_stage === 'seed') color = 'orange';
      else if (project.funding_stage === 'angel') color = 'red';
      else if (project.funding_stage === 'series-a') color = 'purple';
      else if (project.funding_stage === 'series-b') color = 'green';
      else if (project.funding_stage === 'series-c') color = 'gold';
      else if (project.funding_stage === 'pre-ipo') color = 'gray';

      const markerContent = `
        <div style="
          width: 16px; 
          height: 16px; 
          background-color: ${color}; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(0,0,0,0.3);
        "></div>
      `

      const marker = new AMap.Marker({
        position: [project.lng, project.lat],
        content: markerContent,
        offset: new AMap.Pixel(-8, -8),
        title: project.name,
      })
      
      const infoContent = `
        <div style="padding:15px; min-width: 250px;">
          <h4 style="margin: 0 0 10px 0; font-size: 16px;">${project.name}</h4>
          <span style="font-size: 12px; background: #eee; padding: 3px 6px; border-radius: 3px; margin-right: 5px;">${project.funding_stage}</span>
          <span style="font-size: 12px; color: #666;">${new Date(project.created_at).toLocaleDateString()}</span>
          <p style="margin: 10px 0; font-size: 14px; line-height: 1.4;">${project.description}</p>
          <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <div style="font-size: 13px;"><strong>融资目标:</strong> ¥${project.funding_target.toLocaleString()}</div>
            <div style="font-size: 13px;"><strong>项目地址:</strong> ${project.address}</div>
            <div style="font-size: 13px;"><strong>发布人:</strong> ${project.user_name}</div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button onclick="window.location.href='tel:'" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 13px;">
              <Phone size={14} /> 联系创业者
            </button>
            <button onclick="navigator.share && navigator.share({title: '${project.name}', text: '${project.description}', url: window.location.href})" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 13px;">
              <Share2 size={14} /> 分享项目
            </button>
          </div>
        </div>
      `
      const infoWindow = new AMap.InfoWindow({
         content: infoContent,
         offset: new AMap.Pixel(0, -10)
      })

      marker.on('click', () => {
        infoWindow.open(map, marker.getPosition())
      })

      marker.setMap(map)
      markersRef.current.push(marker)
    })
  }, [map, projects])

  // Handle sharing functionality
  const handleShare = (project: ProjectItem) => {
    if (navigator.share) {
      navigator.share({
        title: project.name,
        text: project.description,
        url: window.location.href
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert('项目链接已复制到剪贴板')
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
       <div style={{ width: '320px', padding: '15px', overflowY: 'auto', borderRight: '1px solid #e0e0e0', background: '#fff' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' }}>机会广场</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '14px' }}>搜索项目:</label>
            <input
              type="text"
              placeholder="搜索项目名称或描述..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginBottom: '15px',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            />
            
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '14px' }}>筛选条件:</label>
            <select 
              value={filterStage} 
              onChange={e => setFilterStage(e.target.value)} 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '10px' }}
            >
               <option value="">全部融资阶段</option>
               <option value="seed">种子轮</option>
               <option value="angel">天使轮</option>
               <option value="series-a">A轮</option>
               <option value="series-b">B轮</option>
               <option value="series-c">C轮</option>
               <option value="pre-ipo">Pre-IPO</option>
            </select>
            
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '14px' }}>排序方式:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)} 
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                 <option value="created_at">发布时间</option>
                 <option value="funding_stage">融资阶段</option>
              </select>
              <select 
                value={sortOrder} 
                onChange={e => setSortOrder(e.target.value)} 
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                 <option value="desc">降序</option>
                 <option value="asc">升序</option>
              </select>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>附近项目 (3km)</h3>
          {nearbyProjects.length === 0 ? (
            <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>暂无附近项目，或未获取到您的位置。</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {nearbyProjects.map(project => (
                <li 
                  key={project.id} 
                  style={{ 
                    border: '1px solid #eee', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    marginBottom: '12px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }} 
                  onClick={() => {
                     if(map) {
                       map.setZoomAndCenter(15, [project.lng, project.lat])
                     }
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
                >
                   <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '5px' }}>{project.name}</div>
                   <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                     <span style={{ marginRight: '10px', background: '#f0f0f0', padding: '2px 6px', borderRadius: '10px' }}>{project.funding_stage}</span>
                     <span>{project.distance_km?.toFixed(1)}km</span>
                   </div>
                   <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>{project.address}</div>
                   <div style={{ fontSize: '12px', color: '#666' }}>发布人: {project.user_name}</div>
                </li>
              ))}
            </ul>
          )}
          
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px', marginTop: '30px' }}>全部项目</h3>
          {projects.length === 0 ? (
            <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>暂无符合条件的项目。</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
              {projects.map(project => (
                <div 
                  key={project.id} 
                  style={{ 
                    border: '1px solid #eee', 
                    borderRadius: '8px', 
                    padding: '15px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }} 
                  onClick={() => {
                     if(map) {
                       map.setZoomAndCenter(15, [project.lng, project.lat])
                     }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                   <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', color: '#1a73e8' }}>{project.name}</div>
                   <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                     <span style={{ marginRight: '10px', background: '#e8f0fe', padding: '3px 8px', borderRadius: '12px', color: '#1a73e8', fontWeight: '500' }}>
                       {project.funding_stage}
                     </span>
                     <span style={{ fontSize: '12px', color: '#888' }}>
                       发布于: {new Date(project.created_at).toLocaleDateString()}
                     </span>
                   </div>
                   <div style={{ fontSize: '14px', color: '#333', marginBottom: '10px', lineHeight: '1.5' }}>
                     {project.description.length > 100 ? project.description.substring(0, 100) + '...' : project.description}
                   </div>
                   <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>
                     <strong>融资目标:</strong> ¥{project.funding_target.toLocaleString()}
                   </div>
                   <div style={{ fontSize: '13px', color: '#888' }}>
                     <strong>地址:</strong> {project.address}
                   </div>
                </div>
              ))}
            </div>
          )}
       </div>
       <div style={{ flex: 1, position: 'relative' }}>
         <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
         <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', padding: '12px', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', fontSize: '12px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>项目类型说明</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '12px', height: '12px', background: 'orange', borderRadius: '50%', marginRight: '8px' }}></div> 种子轮</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '12px', height: '12px', background: 'red', borderRadius: '50%', marginRight: '8px' }}></div> 天使轮</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '12px', height: '12px', background: 'purple', borderRadius: '50%', marginRight: '8px' }}></div> A轮</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '12px', height: '12px', background: 'green', borderRadius: '50%', marginRight: '8px' }}></div> B轮</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '12px', height: '12px', background: 'gold', borderRadius: '50%', marginRight: '8px' }}></div> C轮</div>
            <div style={{ display: 'flex', alignItems: 'center' }}><div style={{ width: '12px', height: '12px', background: 'gray', borderRadius: '50%', marginRight: '8px' }}></div> Pre-IPO</div>
         </div>
       </div>
    </div>
  )
}