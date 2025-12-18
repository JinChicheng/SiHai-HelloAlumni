import { useEffect, useRef, useState } from 'react';
import { loadAMap } from '../lib/amap';

interface PoiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  center: { lat: number; lng: number } | null;
  keyword: string; // "停车场" | "餐饮"
}

export default function PoiSearchModal({ isOpen, onClose, center, keyword }: PoiSearchModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [AMap, setAMap] = useState<any>(null);
  const [pois, setPois] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const placeSearchRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && !AMap) {
      loadAMap([
        'AMap.PlaceSearch'
      ]).then((AMapObj) => {
        setAMap(AMapObj);
        if (mapContainer.current && center) {
          const map = new AMapObj.Map(mapContainer.current, {
            zoom: 15,
            center: [center.lng, center.lat]
          });
          setMapInstance(map);
          // Add marker for center
          new AMapObj.Marker({
            position: [center.lng, center.lat],
            map: map,
            icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png'
          });
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && AMap && mapInstance && center && keyword) {
      searchPois();
    }
  }, [isOpen, AMap, mapInstance, center, keyword]);

  const searchPois = () => {
    if (!AMap || !mapInstance || !center) return;

    setLoading(true);
    setPois([]);
    mapInstance.clearMap();
    
    // Re-add center marker
    new AMap.Marker({
        position: [center.lng, center.lat],
        map: mapInstance,
        icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png'
    });

    if (!placeSearchRef.current) {
        placeSearchRef.current = new AMap.PlaceSearch({
            pageSize: 10,
            pageIndex: 1,
            extensions: 'base',
            type: keyword === '餐饮' ? '餐饮服务' : '停车场',
            map: mapInstance
        });
    } else {
        placeSearchRef.current.setType(keyword === '餐饮' ? '餐饮服务' : '停车场');
        placeSearchRef.current.setMap(mapInstance); // Associate with map to auto-show markers
    }

    const c = new AMap.LngLat(center.lng, center.lat);
    placeSearchRef.current.searchNearBy(keyword, c, 1000, (status: string, result: any) => {
        setLoading(false);
        if (status === 'complete' && result.info === 'OK') {
            setPois(result.poiList.pois);
        } else {
            setPois([]);
        }
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '700px',
        height: '80%', display: 'flex', overflow: 'hidden'
      }}>
        <div style={{ width: '300px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                周边{keyword}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading && <div style={{padding: '16px'}}>搜索中...</div>}
                {!loading && pois.length === 0 && <div style={{padding: '16px'}}>未找到结果</div>}
                {pois.map((poi, idx) => (
                    <div key={poi.id} style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                         onClick={() => mapInstance?.setCenter(poi.location)}
                    >
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{idx + 1}. {poi.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{poi.address}</div>
                        <div style={{ fontSize: '12px', color: '#1890ff' }}>距离 {poi.distance} 米</div>
                    </div>
                ))}
            </div>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
            <button 
                onClick={onClose}
                style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'white', border: 'none', borderRadius: '4px',
                    padding: '8px 12px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    cursor: 'pointer', zIndex: 100
                }}
            >
                关闭
            </button>
        </div>
      </div>
    </div>
  );
}
