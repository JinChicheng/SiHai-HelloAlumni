import { NavLink, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { Map, Users, Briefcase, Globe, Calendar, Package, Heart, User, Settings as SettingsIcon } from 'lucide-react'
import Map2D from './pages/Map2D'
import Profile from './pages/Profile'
import MyProfile from './pages/MyProfile'
import IndustryMap from './pages/IndustryMap'
import StartupMap from './pages/StartupMap'
import OverseasMap from './pages/OverseasMap'
import Events from './pages/Events'
import Login from './pages/Login'
import Register from './pages/Register'
import ResourceMap from './pages/ResourceMap'
import CreateResource from './pages/CreateResource'
import ProjectMap from './pages/ProjectMap'
import Welfare from './pages/Welfare'
import WelfareTeamDetail from './pages/WelfareTeamDetail'
import WelfareFootprintMap from './pages/WelfareFootprintMap'
import Settings from './pages/Settings'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default function App() {
  useLocation(); // Force re-render on route change to update auth state in navbar
  const token = localStorage.getItem('token')
  
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app">
      {!isAuthPage && (
        <header className="header">
          <div className="logo">
            <div className="logo-main">四海</div>
            <div className="logo-sub">四海之内皆校友，毕业也要常联系！</div>
          </div>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} title="校友地图">
              <Map size={20} />
              <span className="nav-text">校友地图</span>
            </NavLink>
            <NavLink to="/industry" className={({ isActive }) => isActive ? 'active' : ''} title="行业圈层">
              <Users size={20} />
              <span className="nav-text">行业圈层</span>
            </NavLink>
            <NavLink to="/startups" className={({ isActive }) => isActive ? 'active' : ''} title="创业圈层">
              <Briefcase size={20} />
              <span className="nav-text">创业圈层</span>
            </NavLink>
            <NavLink to="/overseas" className={({ isActive }) => isActive ? 'active' : ''} title="海外校友">
              <Globe size={20} />
              <span className="nav-text">海外校友</span>
            </NavLink>
            <NavLink to="/events" className={({ isActive }) => isActive ? 'active' : ''} title="校友活动">
              <Calendar size={20} />
              <span className="nav-text">校友活动</span>
            </NavLink>
            <NavLink to="/resources" className={({ isActive }) => isActive ? 'active' : ''} title="资源地图">
              <Package size={20} />
              <span className="nav-text">资源地图</span>
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''} title="机会广场">
              <Briefcase size={20} />
              <span className="nav-text">机会广场</span>
            </NavLink>
            <NavLink to="/welfare" className={({ isActive }) => isActive ? 'active' : ''} title="校友公益">
              <Heart size={20} />
              <span className="nav-text">校友公益</span>
            </NavLink>
            {token ? (
              <NavLink to="/my-profile" className={({ isActive }) => isActive ? 'active' : ''} title="个人信息">
                <User size={20} />
                <span className="nav-text">个人信息</span>
              </NavLink>
            ) : (
              <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''} title="登录">
                <User size={20} />
                <span className="nav-text">登录</span>
              </NavLink>
            )}
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''} title="设置">
              <SettingsIcon size={20} />
              <span className="nav-text">设置</span>
            </NavLink>
          </nav>
        </header>
      )}
      <main className="main">
        <Routes>
          <Route path="/" element={
            <PrivateRoute>
              <Map2D />
            </PrivateRoute>
          } />
          <Route path="/industry" element={
            <PrivateRoute>
              <IndustryMap />
            </PrivateRoute>
          } />
          <Route path="/startups" element={
            <PrivateRoute>
              <StartupMap />
            </PrivateRoute>
          } />
          <Route path="/overseas" element={
            <PrivateRoute>
              <OverseasMap />
            </PrivateRoute>
          } />
          <Route path="/events" element={
            <PrivateRoute>
              <Events />
            </PrivateRoute>
          } />
          <Route path="/resources" element={
            <PrivateRoute>
              <ResourceMap />
            </PrivateRoute>
          } />
          <Route path="/resources/new" element={
            <PrivateRoute>
              <CreateResource />
            </PrivateRoute>
          } />
          <Route path="/projects" element={
            <PrivateRoute>
              <ProjectMap />
            </PrivateRoute>
          } />
          <Route path="/welfare" element={
            <PrivateRoute>
              <Welfare />
            </PrivateRoute>
          } />
          <Route path="/welfare/teams/:projectId" element={
            <PrivateRoute>
              <WelfareTeamDetail />
            </PrivateRoute>
          } />
          <Route path="/welfare/footprints" element={
            <PrivateRoute>
              <WelfareFootprintMap />
            </PrivateRoute>
          } />
          <Route path="/profile/:id" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
          <Route path="/my-profile" element={
            <PrivateRoute>
              <MyProfile />
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
