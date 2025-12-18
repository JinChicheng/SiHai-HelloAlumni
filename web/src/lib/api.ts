const base = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

function getHeaders() {
  const token = localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export type AlumniItem = {
  id: number
  name: string
  college?: string
  major?: string
  graduation_year?: number
  industry?: string
  industry_segment?: string | null
  company?: string
  job_title?: string
  funding_stage?: string | null
  business_domain?: string | null
  is_startup?: boolean
  contact_name?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  wechat?: string | null
  qq?: string | null
  country?: string | null
  city?: string | null
  district?: string | null
  address?: string | null
  address_en?: string | null
  lat?: number | null
  lng?: number | null
  office_address?: string | null
  office_lat?: number | null
  office_lng?: number | null
  distance_km?: number | null
  virtual_count?: number | null
}

export type AlumniDetail = {
  id: number
  name: string
  gender?: string | null
  college?: string | null
  major?: string | null
  graduation_year?: number | null
  degree?: string | null
  industry?: string | null
  industry_segment?: string | null
  company?: string | null
  job_title?: string | null
  email?: string | null
  phone?: string | null
  wechat?: string | null
  qq?: string | null
  funding_stage?: string | null
  business_domain?: string | null
  is_startup?: boolean | null
  contact_name?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  country?: string | null
  city?: string | null
  district?: string | null
  address?: string | null
  address_en?: string | null
  lat?: number | null
  lng?: number | null
  office_address?: string | null
  office_lat?: number | null
  office_lng?: number | null
  skills?: string[] | null
  resources?: string[] | null
  bio?: string | null
}

export type ResourceItem = {
  id: number
  user_id: number
  user_name: string
  type: 'recruitment' | 'cooperation' | 'investment' | 'service'
  title: string
  description?: string
  address: string
  lat: number
  lng: number
  contact_name?: string
  contact_phone?: string
  created_at: string
  distance_km?: number
}

export type EventItem = {
  id: number
  title: string
  description?: string
  start_time: string
  end_time?: string
  location_name?: string
  address?: string
  lat?: number
  lng?: number
  created_at: string
}

export type ProjectItem = {
  id: number
  user_id: number
  user_name: string
  name: string
  description: string
  funding_target: number
  funding_stage: string
  address: string
  lat: number
  lng: number
  alumni_id_verification: string
  project_materials: string
  status: string
  created_at: string
  updated_at: string
  distance_km?: number
}

export async function createResource(data: any): Promise<void> {
  const res = await fetch(`${base}/resources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('创建失败')
}

export async function fetchResources(params: Record<string, any>): Promise<ResourceItem[]> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.append(k, String(v))
  })
  const res = await fetch(`${base}/resources?${qs.toString()}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data.items as ResourceItem[]
}

export async function fetchEvents(): Promise<EventItem[]> {
  const res = await fetch(`${base}/events`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data as EventItem[]
}

export async function createEvent(data: any): Promise<EventItem> {
  const res = await fetch(`${base}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('创建失败')
  return res.json()
}

export async function deleteEvent(id: number): Promise<void> {
  const res = await fetch(`${base}/events/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('删除失败')
}

export async function fetchAlumni(params: Record<string, any>): Promise<AlumniItem[]> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.append(k, String(v))
  })
  const res = await fetch(`${base}/alumni?${qs.toString()}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data.items as AlumniItem[]
}

export async function fetchNearby(lat: number, lng: number, radius_km = 5): Promise<AlumniItem[]> {
  const qs = new URLSearchParams({ lat: String(lat), lng: String(lng), radius_km: String(radius_km) })
  const res = await fetch(`${base}/alumni/nearby?${qs.toString()}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data.items as AlumniItem[]
}

export async function fetchAlumniDetail(id: number): Promise<AlumniDetail> {
  const res = await fetch(`${base}/alumni/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data as AlumniDetail
}

export async function fetchMe(): Promise<AlumniDetail> {
  const res = await fetch(`${base}/alumni/me`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data as AlumniDetail
}

export async function updateMe(data: any): Promise<void> {
  const res = await fetch(`${base}/alumni/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('更新失败')
}

export async function fetchStartups(params: Record<string, any>): Promise<AlumniItem[]> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.append(k, String(v))
  })
  const res = await fetch(`${base}/alumni/startups?${qs.toString()}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data.items as AlumniItem[]
}

export async function fetchAlumniGrouped(params: Record<string, any>): Promise<AlumniItem[]> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.append(k, String(v))
  })
  const res = await fetch(`${base}/alumni/grouped?${qs.toString()}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data.items as AlumniItem[]
}

export async function fetchOverseas(country?: string): Promise<Record<string, Record<string, AlumniItem[]>>> {
  const qs = new URLSearchParams()
  if (country) qs.append('country', country)
  const res = await fetch(`${base}/alumni/overseas?${qs.toString()}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data.groups as Record<string, Record<string, AlumniItem[]>>
}

export async function postLiveLocation(token: string, lat: number, lng: number, campus?: string): Promise<boolean> {
  const res = await fetch(`${base}/alumni/live/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ lat, lng, campus })
  })
  if (!res.ok) return false
  const data = await res.json()
  return Boolean(data.ok)
}

export async function fetchLiveLocations(): Promise<Array<{ user_id: number, name: string, lat: number, lng: number, campus?: string, updated_at: string }>> {
  const res = await fetch(`${base}/alumni/live/locations`)
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data.items as any
}

export async function searchLiveByName(name: string): Promise<Array<{ user_id: number, name: string, lat: number, lng: number, campus?: string, updated_at: string }>> {
  const qs = new URLSearchParams({ name })
  const res = await fetch(`${base}/alumni/live/search?${qs.toString()}`)
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data.items as any
}

export async function searchAlumniByLocation(location: string, filters: Record<string, any> = {}): Promise<AlumniItem[]> {
  const params: Record<string, string> = { location }
  
  // Only add filters that have values
  Object.entries(filters).forEach(([key, value]) => {
    if (value != null && value !== '') {
      params[key] = String(value)
    }
  })
  
  const qs = new URLSearchParams(params)
  const res = await fetch(`${base}/alumni/search/location?${qs.toString()}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  const data = await res.json()
  return data.items as AlumniItem[]
}

export async function login(email: string, password: string) {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Login failed')
  }
  return res.json()
}

export async function register(data: any) {
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Registration failed')
  }
  return res.json()
}

// Welfare Project Types

export type WelfareProject = {
  id: number
  title: string
  description?: string
  project_type: string
  location_name?: string
  address?: string
  lat?: number
  lng?: number
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  created_at: string
  created_by: number
}

export type WelfareTeam = {
  id: number
  project_id: number
  title: string
  description?: string
  start_time: string
  end_time?: string
  meet_location?: string
  meet_lat?: number
  meet_lng?: number
  created_at: string
  created_by: number
}

export type WelfareTeamMember = {
  team_id: number
  user_id: number
  joined_at: string
}

export type WelfareFootprint = {
  id: number
  user_id: number
  project_id: number
  project_title?: string
  participation_date: string
  participation_type: string
  description?: string
  created_at: string
  lat?: number
  lng?: number
  user_name?: string
}

// Welfare API Functions

export async function fetchWelfareProjects(params: Record<string, any> = {}): Promise<WelfareProject[]> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.append(k, String(v))
  })
  const res = await fetch(`${base}/welfare/projects?${qs.toString()}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  return await res.json()
}

export async function fetchWelfareProjectDetail(id: number): Promise<WelfareProject> {
  const res = await fetch(`${base}/welfare/projects/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  return await res.json()
}

export async function createWelfareProject(data: any): Promise<WelfareProject> {
  const res = await fetch(`${base}/welfare/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('创建失败')
  return await res.json()
}

export async function fetchWelfareTeams(): Promise<WelfareTeam[]> {
  const res = await fetch(`${base}/welfare/teams`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  return await res.json()
}

export async function fetchWelfareTeamsByProject(projectId: number): Promise<WelfareTeam[]> {
  const res = await fetch(`${base}/welfare/projects/${projectId}/teams`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  return await res.json()
}

export async function createWelfareTeam(data: any): Promise<WelfareTeam> {
  const res = await fetch(`${base}/welfare/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('创建失败')
  return await res.json()
}

export async function joinWelfareTeam(teamId: number, userId: number): Promise<void> {
  const res = await fetch(`${base}/welfare/teams/${teamId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify({ user_id: userId })
  })
  if (!res.ok) throw new Error('加入失败')
}

export async function fetchWelfareTeamMembers(teamId: number): Promise<any[]> {
  const res = await fetch(`${base}/welfare/teams/${teamId}/members`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  return await res.json()
}

export async function fetchUserWelfareFootprints(userId: number): Promise<WelfareFootprint[]> {
  const res = await fetch(`${base}/welfare/footprints/user/${userId}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  return await res.json()
}

export async function fetchAllWelfareFootprints(): Promise<WelfareFootprint[]> {
  const res = await fetch(`${base}/welfare/footprints/all`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求失败')
  return await res.json()
}

export async function createWelfareFootprint(data: any): Promise<WelfareFootprint> {
  const res = await fetch(`${base}/welfare/footprints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('创建失败')
  return await res.json()
}

// Project-related API functions
export async function createProject(data: any): Promise<void> {
  const res = await fetch(`${base}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders()
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('创建项目失败')
}

export async function fetchProjects(params: Record<string, any>): Promise<ProjectItem[]> {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.append(k, String(v))
  })
  const res = await fetch(`${base}/projects?${qs.toString()}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求项目失败')
  const data = await res.json()
  return data.items as ProjectItem[]
}

export async function fetchProject(id: number): Promise<ProjectItem> {
  const res = await fetch(`${base}/projects/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('请求项目详情失败')
  const data = await res.json()
  return data as ProjectItem
}
