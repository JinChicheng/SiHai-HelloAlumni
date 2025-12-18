import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../lib/api'

export default function Register() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    school: '厦门大学',
    college: '',
    major: '',
    degree: '本科',
    graduation_year: 2024,
    verification: {
      method: 'student_record',
      student_id: '',
      year: 2024
    }
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        graduation_year: Number(formData.graduation_year),
        verification: {
            ...formData.verification,
            year: Number(formData.verification.year)
        }
      }
      const res = await register(payload)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateVerification = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      verification: { ...prev.verification, [field]: value }
    }))
  }

  return (
    <div className="register-container" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>注册校友账号</h2>
      
      {step === 1 && (
        <div>
            <h3>第一步：基本信息</h3>
            <div style={{ marginBottom: '1rem' }}>
                <label>邮箱 / 用户名</label>
                <input type="text" value={formData.email} onChange={e => updateField('email', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label>密码</label>
                <input type="password" value={formData.password} onChange={e => updateField('password', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label>姓名</label>
                <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <button onClick={() => setStep(2)}>下一步：身份核验</button>
        </div>
      )}

      {step === 2 && (
        <div>
            <h3>第二步：身份核验</h3>
            <div style={{ marginBottom: '1rem' }}>
                <label>核验方式</label>
                <select 
                    value={formData.verification.method} 
                    onChange={e => updateVerification('method', e.target.value)}
                    style={{ width: '100%', padding: '0.5rem' }}
                >
                    <option value="student_record">学籍信息核验 (学号+姓名)</option>
                    <option value="unified_auth">校内统一身份认证</option>
                    <option value="digital_card">数字身份卡扫码</option>
                </select>
            </div>

            {formData.verification.method === 'student_record' && (
                <>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>学号</label>
                        <input type="text" value={formData.verification.student_id} onChange={e => updateVerification('student_id', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>毕业年份</label>
                        <input type="number" value={formData.verification.year} onChange={e => updateVerification('year', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                    </div>
                </>
            )}

            {formData.verification.method === 'unified_auth' && (
                <div style={{ padding: '1rem', background: '#f0f0f0' }}>
                    <p>将跳转至学校统一身份认证平台...</p>
                    <button type="button" onClick={() => alert('模拟跳转认证成功')}>模拟认证通过</button>
                </div>
            )}
             {formData.verification.method === 'digital_card' && (
                <div style={{ padding: '1rem', background: '#f0f0f0' }}>
                    <p>请扫描数字身份卡二维码...</p>
                    <button type="button" onClick={() => alert('模拟扫码成功')}>模拟扫码成功</button>
                </div>
            )}

            <div style={{ marginTop: '1rem' }}>
                <button onClick={() => setStep(1)} style={{ marginRight: '1rem' }}>上一步</button>
                <button onClick={() => setStep(3)}>下一步：完善资料</button>
            </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleRegister}>
            <h3>第三步：完善资料</h3>
            <div style={{ marginBottom: '1rem' }}>
                <label>学院</label>
                <input type="text" value={formData.college} onChange={e => updateField('college', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label>专业</label>
                <input type="text" value={formData.major} onChange={e => updateField('major', e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            </div>
            
            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            
            <div style={{ marginTop: '1rem' }}>
                <button type="button" onClick={() => setStep(2)} style={{ marginRight: '1rem' }}>上一步</button>
                <button type="submit">完成注册</button>
            </div>
        </form>
      )}
    </div>
  )
}
