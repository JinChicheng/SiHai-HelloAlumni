import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createResource } from '../lib/api'
import { loadAMap } from '../lib/amap'
import { ArrowLeft } from 'lucide-react'

export default function CreateResource() {
  const navigate = useNavigate()
  const mapContainer = useRef<HTMLDivElement>(null)
  const markerRef = useRef<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'recruitment',
    description: '',
    address: '',
    lat: 0,
    lng: 0,
    contact_name: '',
    contact_phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAMap(['AMap.Geocoder']).then((AMap) => {
      if (!mapContainer.current) return
      const map = new AMap.Map(mapContainer.current, {
        zoom: 11,
        center: [104.066541, 30.572269] // Default Chengdu (since user mentioned Chengdu)
      })

      const geocoder = new AMap.Geocoder()

      map.on('click', (e: any) => {
        const lat = e.lnglat.getLat()
        const lng = e.lnglat.getLng()
        
        if (markerRef.current) {
          markerRef.current.setPosition([lng, lat])
        } else {
          const m = new AMap.Marker({ position: [lng, lat] })
          m.setMap(map)
          markerRef.current = m
        }

        geocoder.getAddress([lng, lat], (status: string, result: any) => {
          if (status === 'complete' && result.regeocode) {
            setFormData(prev => ({ ...prev, address: result.regeocode.formattedAddress, lat, lng }))
          } else {
             setFormData(prev => ({ ...prev, lat, lng }))
          }
        })
      })
    }).catch(e => {
      console.error("Map load failed", e)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lat || !formData.lng) {
      setError('请在地图上选择位置')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createResource(formData)
      navigate('/resources')
    } catch (err: any) {
      setError(err.message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '5px', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={20} /> 返回
      </button>
      
      <h2>发布资源</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label>资源标题</label>
            <input 
              type="text" 
              required 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          
          <div>
            <label>资源类型</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any})}
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="recruitment">招聘技术人才</option>
              <option value="cooperation">提供供应链资源</option>
              <option value="investment">投融资需求</option>
              <option value="service">求租办公室/生活服务</option>
            </select>
          </div>

          <div>
            <label>详细描述</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', padding: '8px', height: '100px' }}
            />
          </div>

          <div>
            <label>联系人</label>
            <input 
              type="text" 
              value={formData.contact_name}
              onChange={e => setFormData({...formData, contact_name: e.target.value})}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <label>联系电话</label>
            <input 
              type="text" 
              value={formData.contact_phone}
              onChange={e => setFormData({...formData, contact_phone: e.target.value})}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <label>地址 (点击地图自动获取)</label>
            <input 
              type="text" 
              required
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          {error && <div style={{ color: 'red' }}>{error}</div>}
          
          <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {loading ? '发布中...' : '确认发布'}
          </button>
        </form>

        <div style={{ height: '500px', background: '#eee' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  )
}
