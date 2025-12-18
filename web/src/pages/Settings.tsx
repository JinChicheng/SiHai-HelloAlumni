import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Shield, User, LogOut } from 'lucide-react'

export default function Settings() {
  const navigate = useNavigate()
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="settings-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> 返回
      </button>
      
      <h1 className="settings-title">设置</h1>
      
      <div className="settings-container">
        <div className="settings-section">
          <h2>账户设置</h2>
          <div className="settings-item">
            <div className="settings-icon">
              <User size={20} />
            </div>
            <div className="settings-info">
              <div className="settings-label">个人信息</div>
              <div className="settings-desc">编辑个人资料</div>
            </div>
            <ArrowLeft size={16} className="settings-arrow" />
          </div>
        </div>
        
        <div className="settings-section">
          <h2>通知设置</h2>
          <div className="settings-item">
            <div className="settings-icon">
              <Bell size={20} />
            </div>
            <div className="settings-info">
              <div className="settings-label">消息通知</div>
              <div className="settings-desc">管理通知偏好</div>
            </div>
            <ArrowLeft size={16} className="settings-arrow" />
          </div>
        </div>
        
        <div className="settings-section">
          <h2>安全设置</h2>
          <div className="settings-item">
            <div className="settings-icon">
              <Shield size={20} />
            </div>
            <div className="settings-info">
              <div className="settings-label">隐私设置</div>
              <div className="settings-desc">管理隐私选项</div>
            </div>
            <ArrowLeft size={16} className="settings-arrow" />
          </div>
        </div>
        
        <div className="settings-section">
          <div className="settings-item logout-item" onClick={handleLogout}>
            <div className="settings-icon logout-icon">
              <LogOut size={20} />
            </div>
            <div className="settings-info">
              <div className="settings-label logout-label">退出登录</div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .settings-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .settings-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--ustc-blue);
          margin: 20px 0 32px 0;
        }
        
        .settings-container {
          background: #fff;
          border-radius: 12px;
          box-shadow: var(--shadow-md);
          overflow: hidden;
        }
        
        .settings-section {
          border-bottom: 1px solid var(--border-color);
        }
        
        .settings-section:last-child {
          border-bottom: none;
        }
        
        .settings-section h2 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
          padding: 16px 20px;
          background: #f8fafc;
        }
        
        .settings-item {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .settings-item:hover {
          background: #f1f5f9;
        }
        
        .settings-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          color: var(--ustc-blue);
        }
        
        .settings-info {
          flex: 1;
        }
        
        .settings-label {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        
        .settings-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .settings-arrow {
          color: var(--text-secondary);
          transform: rotate(180deg);
        }
        
        .logout-item {
          padding: 20px;
        }
        
        .logout-icon {
          background: #fee2e2;
          color: #ef4444;
        }
        
        .logout-label {
          color: #ef4444;
        }
      `}</style>
    </div>
  )
}