import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      // Redirect to home or previous page
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">欢迎回家</h2>
          <div className="auth-subtitle">校友地理信息互动平台</div>
          <div className="welcome-text">欢迎校友，以后常联系</div>
        </div>
        
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>用户名 / 邮箱</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="请输入您的账号"
              required
            />
          </div>
          
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入您的密码"
              required
            />
          </div>

          {error && <div style={{ color: '#EF4444', marginBottom: '1rem', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
          
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
        
        <div className="auth-footer">
          还没有账号？ <a href="/register">立即注册</a>
        </div>
      </div>
    </div>
  )
}
