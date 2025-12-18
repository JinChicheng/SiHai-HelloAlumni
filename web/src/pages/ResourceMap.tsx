import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchResources, ResourceItem } from '../lib/api'
import { loadAMap } from '../lib/amap'
import { Plus, Filter, MapPin } from 'lucide-react'

export default function ResourceMap() {
  const navigate = useNavigate()
  const mapContainer = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [nearbyResources, setNearbyResources] = useState<ResourceItem[]>([])
  const [filterType, setFilterType] = useState<string>('')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
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
            // Fetch nearby
            fetchResources({ lat, lng, radius_km: 3 }).then(setNearbyResources)
         }
       })
    }).catch(e => console.error(e))
  }, [])

  // Fetch all resources when filter changes
  useEffect(() => {
    fetchResources({ type: filterType }).then(data => {
        setResources(data)
    })
  }, [filterType])

  // Update markers
  useEffect(() => {
    if (!map || !resources.length) return
    
    // Clear existing
    map.remove(markersRef.current)
    markersRef.current = []

    const AMap = (window as any).AMap

    resources.forEach(r => {
      // Define color based on type
      let color = 'blue';
      if (r.type === 'recruitment') color = 'red';
      else if (r.type === 'cooperation') color = 'green';
      else if (r.type === 'investment') color = 'gold';
      else if (r.type === 'service') color = 'purple';

      // Create a simple content marker or just standard marker
      // Using standard marker for now, maybe custom content later if needed
      // To differentiate colors, we can use content property or icon
      // Using content for custom colored dot
      const markerContent = `
        <div style="
          width: 14px; 
          height: 14px; 
          background-color: ${color}; 
          border-radius: 50%; 
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        "></div>
      `

      const marker = new AMap.Marker({
        position: [r.lng, r.lat],
        content: markerContent,
        offset: new AMap.Pixel(-7, -7),
        title: r.title,
      })
      
      const infoContent = `
        <div style="padding:10px; min-width: 200px;">
          <h4 style="margin: 0 0 5px 0;">${r.title}</h4>
          <span style="font-size: 12px; background: #eee; padding: 2px 5px; border-radius: 3px;">${r.type}</span>
          <p style="margin: 5px 0; font-size: 13px;">${r.description || '暂无描述'}</p>
          <div style="margin-top: 10px; font-size: 13px;">
            <div>联系人: ${r.contact_name || r.user_name}</div>
            ${r.contact_phone ? `<div>电话: <a href="tel:${r.contact_phone}">${r.contact_phone}</a></div>` : ''}
          </div>
          <button onclick="window.location.href='tel:${r.contact_phone}'" style="margin-top: 8px; width: 100%; padding: 5px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
            联系发布人
          </button>
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
  }, [map, resources])

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
       <div style={{ width: '300px', padding: '10px', overflowY: 'auto', borderRight: '1px solid #ccc', background: '#fff' }}>
          <button onClick={() => navigate('/resources/new')} style={{ width: '100%', padding: '10px', marginBottom: '15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
             <Plus size={16} /> 发布资源
          </button>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>筛选资源类型:</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
               <option value="">全部资源</option>
               <option value="recruitment">招聘技术人才</option>
               <option value="cooperation">供应链资源</option>
               <option value="investment">投融资需求</option>
               <option value="service">生活/办公服务</option>
            </select>
          </div>

          <h3 style={{ fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>附近资源 (3km)</h3>
          {nearbyResources.length === 0 ? <p style={{ color: '#999', fontSize: '14px' }}>暂无附近资源，或未获取到您的位置。</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {nearbyResources.map(r => (
                <li key={r.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', cursor: 'pointer' }} onClick={() => {
                   if(map) {
                     map.setZoomAndCenter(15, [r.lng, r.lat])
                   }
                }}>
                   <div style={{ fontWeight: 'bold' }}>{r.title}</div>
                   <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                     <span style={{ marginRight: '10px' }}>{r.type}</span>
                     <span>{r.distance_km?.toFixed(1)}km</span>
                   </div>
                   <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>提供者: {r.user_name}</div>
                </li>
              ))}
            </ul>
          )}
       </div>
       <div style={{ flex: 1, position: 'relative' }}>
         <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
         <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', padding: '10px', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '10px', height: '10px', background: 'red', borderRadius: '50%', marginRight: '5px' }}></div> 招聘</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '10px', height: '10px', background: 'green', borderRadius: '50%', marginRight: '5px' }}></div> 合作</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}><div style={{ width: '10px', height: '10px', background: 'gold', borderRadius: '50%', marginRight: '5px' }}></div> 投融资</div>
            <div style={{ display: 'flex', alignItems: 'center' }}><div style={{ width: '10px', height: '10px', background: 'purple', borderRadius: '50%', marginRight: '5px' }}></div> 服务</div>
         </div>
       </div>
    </div>
  )
}
