import { useState } from 'react'
import { X, Navigation, ParkingSquare, Utensils } from 'lucide-react'
import type { AlumniDetail } from '../lib/api'
import NavigationModal from './NavigationModal'
import PoiSearchModal from './PoiSearchModal'

type Props = {
  detail: AlumniDetail
  onClose: () => void
}

export default function AlumniDetailPanel({ detail, onClose }: Props) {
  const [navTarget, setNavTarget] = useState<{lat: number, lng: number, address: string, name?: string} | null>(null);
  const [poiSearch, setPoiSearch] = useState<{center: {lat: number, lng: number}, keyword: string} | null>(null);

  return (
    <>
      <div className="floating-card detail-card">
        <div className="detail-header">
          <div className="detail-title">{detail.name}</div>
          <button className="icon-btn" onClick={onClose} title="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="detail-body">
          <div className="detail-row">
            <span className="detail-label">院系</span>
            <span className="detail-value">{detail.college || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">专业</span>
            <span className="detail-value">{detail.major || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">毕业年份</span>
            <span className="detail-value">{detail.graduation_year ?? '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">行业</span>
            <span className="detail-value">{detail.industry || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">公司</span>
            <div className="detail-value" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
               <span>{detail.company || '—'}</span>
               {detail.office_address && <span style={{fontSize: '0.9em', color: '#666'}}>{detail.office_address}</span>}
               {detail.company && detail.office_lat && detail.office_lng && (
                 <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                   <button 
                     className="action-btn"
                     style={{
                       display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', 
                       padding: '4px 8px', width: 'fit-content', border: '1px solid #ddd', 
                       borderRadius: '4px', background: 'white', cursor: 'pointer'
                     }}
                     onClick={() => setNavTarget({
                       lat: detail.office_lat!, 
                       lng: detail.office_lng!, 
                       address: detail.office_address || detail.company!, 
                       name: detail.company || '公司'
                     })}
                   >
                     <Navigation size={12} /> 导航
                   </button>
                   <button 
                     className="action-btn"
                     style={{
                       display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', 
                       padding: '4px 8px', width: 'fit-content', border: '1px solid #ddd', 
                       borderRadius: '4px', background: 'white', cursor: 'pointer'
                     }}
                     onClick={() => setPoiSearch({center: {lat: detail.office_lat!, lng: detail.office_lng!}, keyword: '停车场'})}
                   >
                     <ParkingSquare size={12} /> 停车场
                   </button>
                   <button 
                     className="action-btn"
                     style={{
                       display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', 
                       padding: '4px 8px', width: 'fit-content', border: '1px solid #ddd', 
                       borderRadius: '4px', background: 'white', cursor: 'pointer'
                     }}
                     onClick={() => setPoiSearch({center: {lat: detail.office_lat!, lng: detail.office_lng!}, keyword: '餐饮'})}
                   >
                     <Utensils size={12} /> 餐饮
                   </button>
                 </div>
               )}
            </div>
          </div>
          <div className="detail-row">
            <span className="detail-label">职位</span>
            <span className="detail-value">{detail.job_title || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">城市/区域</span>
            <span className="detail-value">{detail.city || detail.district || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">地址</span>
            <div className="detail-value" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
               <span>{detail.address || '—'}</span>
               {detail.lat && detail.lng && (
                 <button 
                   className="action-btn"
                   style={{
                     display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', 
                     padding: '4px 8px', width: 'fit-content', border: '1px solid #ddd', 
                     borderRadius: '4px', background: 'white', cursor: 'pointer'
                   }}
                   onClick={() => setNavTarget({
                     lat: detail.lat!, 
                     lng: detail.lng!, 
                     address: detail.address || '常驻地', 
                     name: detail.name + '的常驻地'
                   })}
                 >
                   <Navigation size={12} /> 导航至常驻地
                 </button>
               )}
            </div>
          </div>
          {!!detail.skills?.length && (
            <div className="detail-row">
              <span className="detail-label">技能</span>
              <span className="detail-tags">
                {detail.skills.map((s, idx) => <span key={idx} className="detail-tag">{s}</span>)}
              </span>
            </div>
          )}
          {!!detail.resources?.length && (
            <div className="detail-row">
              <span className="detail-label">资源</span>
              <span className="detail-tags">
                {detail.resources.map((s, idx) => <span key={idx} className="detail-tag">{s}</span>)}
              </span>
            </div>
          )}
          {detail.bio && (
            <div className="detail-row">
              <span className="detail-label">简介</span>
              <span className="detail-value">{detail.bio}</span>
            </div>
          )}
        </div>
      </div>
      <NavigationModal isOpen={!!navTarget} onClose={() => setNavTarget(null)} target={navTarget} />
      <PoiSearchModal isOpen={!!poiSearch} onClose={() => setPoiSearch(null)} center={poiSearch?.center || null} keyword={poiSearch?.keyword || ''} />
    </>
  )
}
