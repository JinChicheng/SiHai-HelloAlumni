import { useState, useEffect } from 'react'
import { fetchMe, updateMe, AlumniDetail } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function MyProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<AlumniDetail | null>(null)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchMe()
      .then(setData)
      .catch(err => {
        console.error(err)
        setMessage('无法加载个人信息，请确认已登录')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data) return
    setSaving(true)
    setMessage('')
    try {
      await updateMe({
        user: {
            name: data.name,
            graduation_year: data.graduation_year
        },
        profile: {
            school: data.school,
            college: data.college,
            major: data.major,
            degree: data.degree,
            gender: data.gender,
            email: data.email,
            phone: data.phone,
            city: data.city,
            district: data.district,
            address: data.address,
            address_en: data.address_en,
            country: data.country,
            job_title: data.job_title,
            company: data.company,
            industry: data.industry,
            industry_segment: data.industry_segment,
            is_startup: data.is_startup,
            business_domain: data.business_domain,
            funding_stage: data.funding_stage,
            contact_name: data.contact_name,
            contact_phone: data.contact_phone,
            contact_email: data.contact_email,
            office_address: data.office_address,
            office_lat: data.office_lat,
            office_lng: data.office_lng,
            bio: data.bio,
            skills: data.skills,
            resources: data.resources,
            privacy_level: (data as any).privacy_level
        }
      })
      setMessage('保存成功')
    } catch (err) {
      console.error(err)
      setMessage('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof AlumniDetail, value: any) => {
    if (!data) return
    setData({ ...data, [field]: value })
  }

  if (loading) return <div className="loading-page">加载中...</div>
  if (!data) return (
    <div className="profile-page">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 返回地图
        </button>
        <div className="profile-card">
          <div className="profile-section" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '24px' }}>{message}</p>
            <button className="auth-btn" onClick={() => navigate('/login')}>去登录</button>
          </div>
        </div>
    </div>
  )

  return (
    <div className="profile-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        ← 返回地图
      </button>
      
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">
            {data.name?.charAt(0) || '我'}
          </div>
          <div className="info">
            <h1>{data.name || '校友'}</h1>
            <div className="tags">
              <span className="tag">{data.school || '校友'}</span>
              <span className="tag">{data.graduation_year || '届'}</span>
            </div>
          </div>
        </div>

        {message && (
          <div style={{ 
            padding: '12px 40px', 
            background: message.includes('失败') ? '#FEE2E2' : '#D1FAE5',
            color: message.includes('失败') ? '#DC2626' : '#059669',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="profile-section">
              <h2>基本信息</h2>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>姓名</label>
                      <input value={data.name || ''} onChange={e => updateField('name', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                      <label>性别</label>
                      <select 
                          value={data.gender || ''} 
                          onChange={e => updateField('gender', e.target.value)}
                          style={{ 
                            width: '100%', 
                            padding: '12px 16px', 
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            fontSize: '15px',
                            transition: 'all 0.2s',
                            background: '#F8FAFC'
                          }}
                      >
                          <option value="">请选择</option>
                          <option value="男">男</option>
                          <option value="女">女</option>
                      </select>
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>毕业年份</label>
                      <input type="number" value={data.graduation_year || ''} onChange={e => updateField('graduation_year', Number(e.target.value))} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                      <label>学位</label>
                      <select 
                          value={data.degree || ''} 
                          onChange={e => updateField('degree', e.target.value)}
                          style={{ 
                            width: '100%', 
                            padding: '12px 16px', 
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            fontSize: '15px',
                            transition: 'all 0.2s',
                            background: '#F8FAFC'
                          }}
                      >
                          <option value="">请选择</option>
                          <option value="本科">本科</option>
                          <option value="硕士">硕士</option>
                          <option value="博士">博士</option>
                      </select>
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>学校</label>
                      <input value={data.school || ''} onChange={e => updateField('school', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                      <label>学院</label>
                      <input value={data.college || ''} onChange={e => updateField('college', e.target.value)} />
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>专业</label>
                      <input value={data.major || ''} onChange={e => updateField('major', e.target.value)} />
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>邮箱</label>
                      <input type="email" value={data.email || ''} onChange={e => updateField('email', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                      <label>电话</label>
                      <input value={data.phone || ''} onChange={e => updateField('phone', e.target.value)} />
                  </div>
              </div>
          </div>

          <div className="profile-section">
              <h2>职业信息</h2>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>行业</label>
                      <input value={data.industry || ''} onChange={e => updateField('industry', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                      <label>行业细分</label>
                      <input value={data.industry_segment || ''} onChange={e => updateField('industry_segment', e.target.value)} />
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>公司</label>
                      <input value={data.company || ''} onChange={e => updateField('company', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                      <label>职位</label>
                      <input value={data.job_title || ''} onChange={e => updateField('job_title', e.target.value)} />
                  </div>
              </div>
              <div className="form-group">
                  <label>是否创业</label>
                  <select 
                      value={data.is_startup ? 'true' : 'false'} 
                      onChange={e => updateField('is_startup', e.target.value === 'true')}
                      style={{ 
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        background: '#F8FAFC'
                      }}
                  >
                      <option value="false">否</option>
                      <option value="true">是</option>
                  </select>
              </div>
              
              {data.is_startup && (
                  <div style={{ 
                    margin: '16px 0 0 0', 
                    padding: '24px', 
                    background: '#F8FAFC', 
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)'
                  }}>
                      <h3 style={{ 
                        margin: '0 0 20px 0', 
                        fontSize: '16px', 
                        color: 'var(--ustc-blue)',
                        fontWeight: 600
                      }}>创业信息</h3>
                      <div className="form-row">
                          <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                              <label>业务领域</label>
                              <input value={data.business_domain || ''} onChange={e => updateField('business_domain', e.target.value)} />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                              <label>融资阶段</label>
                              <input value={data.funding_stage || ''} onChange={e => updateField('funding_stage', e.target.value)} />
                          </div>
                      </div>
                      <div className="form-row">
                          <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                              <label>联系人</label>
                              <input value={data.contact_name || ''} onChange={e => updateField('contact_name', e.target.value)} />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                              <label>联系电话</label>
                              <input value={data.contact_phone || ''} onChange={e => updateField('contact_phone', e.target.value)} />
                          </div>
                      </div>
                      <div className="form-group">
                          <label>联系邮箱</label>
                          <input type="email" value={data.contact_email || ''} onChange={e => updateField('contact_email', e.target.value)} />
                      </div>
                  </div>
              )}
              
              <div className="form-group" style={{ marginTop: '24px' }}>
                  <label>公司地址</label>
                  <input value={data.office_address || ''} onChange={e => updateField('office_address', e.target.value)} />
              </div>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>公司坐标 (Lat)</label>
                      <input type="number" step="any" value={data.office_lat || ''} onChange={e => updateField('office_lat', Number(e.target.value))} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                      <label>公司坐标 (Lng)</label>
                      <input type="number" step="any" value={data.office_lng || ''} onChange={e => updateField('office_lng', Number(e.target.value))} />
                  </div>
              </div>
          </div>

          <div className="profile-section">
              <h2>位置信息</h2>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>国家</label>
                      <input value={data.country || ''} onChange={e => updateField('country', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                      <label>城市</label>
                      <input value={data.city || ''} onChange={e => updateField('city', e.target.value)} />
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>区县</label>
                      <input value={data.district || ''} onChange={e => updateField('district', e.target.value)} />
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>详细地址</label>
                      <input value={data.address || ''} onChange={e => updateField('address', e.target.value)} />
                  </div>
              </div>
              <div className="form-row">
                  <div className="form-group" style={{ flex: 1, marginRight: '1rem' }}>
                      <label>英文地址</label>
                      <input value={data.address_en || ''} onChange={e => updateField('address_en', e.target.value)} />
                  </div>
              </div>
          </div>

          <div className="profile-section">
              <h2>个人信息</h2>
              <div className="form-group">
                  <label>个人简介</label>
                  <textarea 
                      value={data.bio || ''} 
                      onChange={e => updateField('bio', e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '12px', 
                        fontSize: '15px',
                        minHeight: '120px', 
                        resize: 'vertical',
                        background: '#F8FAFC',
                        transition: 'all 0.2s'
                      }}
                  />
              </div>
              <div className="form-group">
                  <label>技能 (逗号分隔)</label>
                  <input 
                      value={Array.isArray(data.skills) ? data.skills.join(', ') : ''} 
                      onChange={e => updateField('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="例如：沟通, 协作, 编程, 管理"
                  />
              </div>
              <div className="form-group">
                  <label>可提供资源 (逗号分隔)</label>
                  <input 
                      value={Array.isArray(data.resources) ? data.resources.join(', ') : ''} 
                      onChange={e => updateField('resources', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="例如：内推, 行业交流, 资金对接"
                  />
              </div>
          </div>

          <div className="profile-section">
              <h2>隐私设置</h2>
              <div className="form-group">
                  <label>隐私级别</label>
                  <select 
                      value={(data as any).privacy_level || 'district'} 
                      onChange={e => updateField('privacy_level' as any, e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '12px 16px', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        fontSize: '15px',
                        transition: 'all 0.2s',
                        background: '#F8FAFC'
                      }}
                  >
                      <option value="city">仅显示城市</option>
                      <option value="district">显示到区县 (默认)</option>
                      <option value="address">显示详细地址</option>
                      <option value="friends">仅好友可见</option>
                      <option value="hidden">隐藏位置</option>
                  </select>
              </div>
          </div>

          <div className="profile-section" style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: '16px',
            paddingTop: '24px'
          }}>
              <button 
                type="button" 
                onClick={() => navigate('/')}
                style={{ 
                  padding: '12px 32px', 
                  background: '#F3F4F6',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                取消
              </button>
              <button 
                type="submit" 
                disabled={saving}
                style={{ 
                  padding: '12px 32px', 
                  background: saving ? '#93C5FD' : 'var(--ustc-blue)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: saving ? 0.8 : 1
                }}
              >
                {saving ? '保存中...' : '保存修改'}
              </button>
          </div>
        </form>
      </div>
    </div>
  )
}