import { useEffect, useRef, useState } from 'react';
import { loadAMap } from '../lib/amap';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    lat: number;
    lng: number;
    address: string;
    name?: string;
  } | null;
}

type TravelMode = 'driving' | 'walking' | 'transfer';

export default function NavigationModal({ isOpen, onClose, target }: NavigationModalProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [AMap, setAMap] = useState<any>(null);
  const [mode, setMode] = useState<TravelMode>('driving');
  const [routeInfo, setRouteInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const plannerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && !AMap) {
      loadAMap([
        'AMap.Driving',
        'AMap.Walking',
        'AMap.Transfer',
        'AMap.Geolocation'
      ]).then((AMapObj) => {
        setAMap(AMapObj);
        if (mapContainer.current) {
          const map = new AMapObj.Map(mapContainer.current, {
            zoom: 13,
            center: target ? [target.lng, target.lat] : undefined
          });
          setMapInstance(map);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && AMap && mapInstance && target) {
      planRoute();
    }
  }, [isOpen, AMap, mapInstance, target, mode]);

  const planRoute = () => {
    if (!AMap || !mapInstance || !target) return;
    
    setLoading(true);
    setRouteInfo('规划中...');

    // Clear previous route
    if (plannerRef.current) {
      plannerRef.current.clear();
    }
    mapInstance.clearMap();

    // Get current location
    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    geolocation.getCurrentPosition((status: string, result: any) => {
      if (status === 'complete') {
        const startLngLat = [result.position.lng, result.position.lat];
        const endLngLat = [target.lng, target.lat];

        let PlannerClass;
        let options = {
          map: mapInstance,
          panel: "panel" // If we wanted a text panel, but maybe we just want visual
        };

        if (mode === 'driving') {
          PlannerClass = AMap.Driving;
          options = { ...options, policy: AMap.DrivingPolicy.LEAST_TIME };
        } else if (mode === 'walking') {
          PlannerClass = AMap.Walking;
        } else {
          PlannerClass = AMap.Transfer;
          options = { ...options, city: '北京市', policy: AMap.TransferPolicy.LEAST_TIME }; // City needs to be dynamic ideally
        }

        const planner = new PlannerClass(options);
        plannerRef.current = planner;

        planner.search(startLngLat, endLngLat, (status: string, result: any) => {
          setLoading(false);
          if (status === 'complete') {
            if (mode === 'driving') {
               const time = Math.round(result.routes[0].time / 60);
               const dist = (result.routes[0].distance / 1000).toFixed(1);
               setRouteInfo(`预计 ${time} 分钟 (${dist} km)`);
            } else if (mode === 'walking') {
               const time = Math.round(result.routes[0].time / 60);
               const dist = (result.routes[0].distance / 1000).toFixed(1);
               setRouteInfo(`预计 ${time} 分钟 (${dist} km)`);
            } else if (mode === 'transfer') {
               if (result.plans && result.plans.length > 0) {
                 const time = Math.round(result.plans[0].time / 60);
                 const dist = (result.plans[0].distance / 1000).toFixed(1);
                 setRouteInfo(`预计 ${time} 分钟 (${dist} km)`);
               } else {
                 setRouteInfo('未找到合适路线');
               }
            }
          } else {
            setRouteInfo('路线规划失败: ' + result);
          }
        });
      } else {
        setLoading(false);
        setRouteInfo('定位失败');
        // If geolocation fails, center on target
        mapInstance.setCenter([target.lng, target.lat]);
        new AMap.Marker({
            position: [target.lng, target.lat],
            map: mapInstance
        });
      }
    });
  };

  const openExternalNavigation = () => {
    if (!target) return;
    // Using URI API
    // https://lbs.amap.com/api/uri-api/guide/travel/route
    const name = target.name || target.address;
    const url = `https://uri.amap.com/navigation?to=${target.lng},${target.lat},${name}&mode=${mode === 'transfer' ? 'bus' : mode === 'walking' ? 'walk' : 'car'}&callnative=1`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '600px',
        height: '80%', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>导航至: {target?.name || target?.address}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
          <button 
            style={{ flex: 1, padding: '12px', background: mode === 'driving' ? '#e6f7ff' : 'white', border: 'none', cursor: 'pointer', fontWeight: mode === 'driving' ? 'bold' : 'normal' }}
            onClick={() => setMode('driving')}
          >
            驾车
          </button>
          <button 
            style={{ flex: 1, padding: '12px', background: mode === 'transfer' ? '#e6f7ff' : 'white', border: 'none', cursor: 'pointer', fontWeight: mode === 'transfer' ? 'bold' : 'normal' }}
            onClick={() => setMode('transfer')}
          >
            公交
          </button>
          <button 
            style={{ flex: 1, padding: '12px', background: mode === 'walking' ? '#e6f7ff' : 'white', border: 'none', cursor: 'pointer', fontWeight: mode === 'walking' ? 'bold' : 'normal' }}
            onClick={() => setMode('walking')}
          >
            步行
          </button>
        </div>

        <div style={{ padding: '8px 16px', backgroundColor: '#f9f9f9', fontSize: '14px', color: '#666' }}>
          {loading ? '加载中...' : routeInfo}
        </div>

        <div ref={mapContainer} style={{ flex: 1, width: '100%' }} />

        <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
          <button 
            onClick={openExternalNavigation}
            style={{ 
              width: '100%', padding: '12px', backgroundColor: '#1890ff', color: 'white', 
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px'
            }}
          >
            开始导航 (打开高德)
          </button>
        </div>
      </div>
    </div>
  );
}
