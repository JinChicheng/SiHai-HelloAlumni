import AMapLoader from '@amap/amap-jsapi-loader';

export async function loadAMap(plugins: string[] = []): Promise<any> {
  const key = import.meta.env.VITE_AMAP_KEY;
  if (!key) throw new Error('未配置 VITE_AMAP_KEY');

  // Configure security code if available (needed for newer keys)
  if (import.meta.env.VITE_AMAP_SECURITY_CODE) {
    (window as any)._AMapSecurityConfig = {
      securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE,
    };
  }

  return AMapLoader.load({
    key,
    version: "2.0",
    plugins,
  });
}
