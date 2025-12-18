import { useEffect, useState } from 'react'
import { Calendar, MapPin, Navigation, Plus, Trash2, Users, Heart, Award } from 'lucide-react'
import { 
  fetchWelfareProjects, 
  createWelfareProject, 
  fetchWelfareTeamsByProject,
  createWelfareTeam,
  joinWelfareTeam,
  type WelfareProject,
  type WelfareTeam
} from '../lib/api'
import NavigationModal from '../components/NavigationModal'

export default function Welfare() {
  const [projects, setProjects] = useState<WelfareProject[]>([])
  const [teams, setTeams] = useState<{ [projectId: number]: WelfareTeam[] }>({})
  const [loading, setLoading] = useState(true)
  const [navTarget, setNavTarget] = useState<{lat: number, lng: number, address: string, name: string} | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showTeamForm, setShowTeamForm] = useState<{projectId: number, projectTitle: string} | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'charity',
    location_name: '',
    address: '',
    lat: '',
    lng: '',
    contact_name: '',
    contact_phone: '',
    contact_email: ''
  })
  const [teamFormData, setTeamFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    meet_location: '',
    meet_lat: '',
    meet_lng: ''
  })

  useEffect(() => {
    fetchWelfareProjects().then(projects => {
      setProjects(projects)
      // 为每个项目加载团队
      projects.forEach(project => {
        fetchWelfareTeamsByProject(project.id)
          .then(projectTeams => {
            setTeams(prev => ({
              ...prev,
              [project.id]: projectTeams
            }))
          })
      })
    }).finally(() => setLoading(false))
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newProject = await createWelfareProject({
        ...formData,
        created_by: 1, // 这里应该从用户信息中获取，暂时硬编码
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null
      })
      setProjects([newProject, ...projects])
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        project_type: 'charity',
        location_name: '',
        address: '',
        lat: '',
        lng: '',
        contact_name: '',
        contact_phone: '',
        contact_email: ''
      })
    } catch (error) {
      alert('创建失败：' + (error as Error).message)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showTeamForm) return
    
    try {
      const newTeam = await createWelfareTeam({
        ...teamFormData,
        project_id: showTeamForm.projectId,
        created_by: 1, // 这里应该从用户信息中获取，暂时硬编码
        meet_lat: teamFormData.meet_lat ? parseFloat(teamFormData.meet_lat) : null,
        meet_lng: teamFormData.meet_lng ? parseFloat(teamFormData.meet_lng) : null
      })
      
      setTeams(prev => ({
        ...prev,
        [showTeamForm.projectId]: [newTeam, ...(prev[showTeamForm.projectId] || [])]
      }))
      
      setShowTeamForm(null)
      setTeamFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        meet_location: '',
        meet_lat: '',
        meet_lng: ''
      })
    } catch (error) {
      alert('创建团队失败：' + (error as Error).message)
    }
  }

  const handleJoinTeam = async (teamId: number) => {
    try {
      await joinWelfareTeam(teamId, 1) // 这里应该从用户信息中获取，暂时硬编码
      alert('加入成功！')
    } catch (error) {
      alert('加入失败：' + (error as Error).message)
    }
  }

  const getProjectTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'charity': '公益慈善',
      'education': '教育助学',
      'environmental': '环境保护',
      'community': '社区服务',
      'healthcare': '健康医疗',
      'disaster': '灾害救援',
      'other': '其他'
    }
    return typeMap[type] || type
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            margin: '0 auto 20px', 
            border: '4px solid var(--border-color)', 
            borderTop: '4px solid var(--ustc-blue)', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="welfare-page" style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
      padding: '40px 20px' 
    }}>
      <div className="container" style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        animation: 'fadeIn 0.5s ease-out' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          padding: '0 8px' 
        }}>
          <div>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '32px', 
              fontWeight: '800', 
              color: 'var(--ustc-blue)',
              background: 'linear-gradient(135deg, var(--ustc-blue) 0%, var(--ustc-blue-dark) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              校友公益项目
            </h1>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-secondary)', 
              fontSize: '16px' 
            }}>
              参与公益活动，传递爱心，汇聚校友力量
            </p>
          </div>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '12px 24px', 
                    backgroundColor: 'var(--ustc-blue)', 
                    color: 'white',
                    border: 'none', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.3s ease'
                  }}
          >
            <Plus size={18} />
            {showCreateForm ? '取消创建' : '创建公益项目'}
          </button>
        </div>

        {showCreateForm && (
          <div className="create-form" style={{
            backgroundColor: 'white', 
            padding: '32px', 
            borderRadius: '16px', 
            boxShadow: 'var(--shadow-lg)', 
            marginBottom: '32px',
            border: '1px solid var(--border-color)',
            transition: 'all 0.3s ease',
            animation: 'slideUp 0.4s ease-out'
          }}>
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '24px',
              fontSize: '24px',
              color: 'var(--ustc-blue)',
              fontWeight: '700'
            }}>
              创建新公益项目
            </h2>
            <form onSubmit={handleCreateProject} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '24px',
              '@media (max-width: 768px)': {
                gridTemplateColumns: '1fr'
              }
            }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  项目标题 *
                </label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="输入公益项目标题"
                />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  项目描述
                </label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    resize: 'vertical',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    minHeight: '120px',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="详细描述公益项目内容、目标和意义"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  项目类型
                </label>
                <select
                  value={formData.project_type}
                  onChange={(e) => setFormData({...formData, project_type: e.target.value})}
                  style={{
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                >
                  <option value="charity">公益慈善</option>
                  <option value="education">教育助学</option>
                  <option value="environmental">环境保护</option>
                  <option value="community">社区服务</option>
                  <option value="healthcare">健康医疗</option>
                  <option value="disaster">灾害救援</option>
                  <option value="other">其他</option>
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  地点名称
                </label>
                <input 
                  type="text" 
                  value={formData.location_name} 
                  onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="例如：希望小学"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  详细地址
                </label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="例如：甘肃省定西市陇西县"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  纬度（可选）
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.lat} 
                  onChange={(e) => setFormData({...formData, lat: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="39.9042"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  经度（可选）
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.lng} 
                  onChange={(e) => setFormData({...formData, lng: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="116.4074"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  联系人
                </label>
                <input 
                  type="text" 
                  value={formData.contact_name} 
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="输入联系人姓名"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  联系电话
                </label>
                <input 
                  type="tel" 
                  value={formData.contact_phone} 
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="输入联系电话"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  联系邮箱
                </label>
                <input 
                  type="email" 
                  value={formData.contact_email} 
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="输入联系邮箱"
                />
              </div>
              
              <div style={{ 
                gridColumn: 'span 2', 
                display: 'flex', 
                gap: '16px', 
                justifyContent: 'flex-end',
                marginTop: '8px' 
              }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '12px 24px', 
                    backgroundColor: '#f8fafc', 
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#e2e8f0',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  取消
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '12px 32px', 
                    backgroundColor: 'var(--ustc-blue)', 
                    color: 'white',
                    border: 'none', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  创建公益项目
                </button>
              </div>
            </form>
          </div>
        )}

        {showTeamForm && (
          <div className="create-form" style={{
            backgroundColor: 'white', 
            padding: '32px', 
            borderRadius: '16px', 
            boxShadow: 'var(--shadow-lg)', 
            marginBottom: '32px',
            border: '1px solid var(--border-color)',
            transition: 'all 0.3s ease',
            animation: 'slideUp 0.4s ease-out'
          }}>
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '24px',
              fontSize: '24px',
              color: 'var(--ustc-blue)',
              fontWeight: '700'
            }}>
              为项目 <span style={{ color: 'var(--ustc-gold)' }}>{showTeamForm.projectTitle}</span> 创建团队
            </h2>
            <form onSubmit={handleCreateTeam} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '24px',
              '@media (max-width: 768px)': {
                gridTemplateColumns: '1fr'
              }
            }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  团队名称 *
                </label>
                <input 
                  type="text" 
                  value={teamFormData.title} 
                  onChange={(e) => setTeamFormData({...teamFormData, title: e.target.value})}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="输入团队名称"
                />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  团队描述
                </label>
                <textarea 
                  value={teamFormData.description} 
                  onChange={(e) => setTeamFormData({...teamFormData, description: e.target.value})}
                  rows={4}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    resize: 'vertical',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    minHeight: '120px',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="详细描述团队活动内容和流程"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  开始时间 *
                </label>
                <input 
                  type="datetime-local" 
                  value={teamFormData.start_time} 
                  onChange={(e) => setTeamFormData({...teamFormData, start_time: e.target.value})}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  结束时间
                </label>
                <input 
                  type="datetime-local" 
                  value={teamFormData.end_time} 
                  onChange={(e) => setTeamFormData({...teamFormData, end_time: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  集合地点
                </label>
                <input 
                  type="text" 
                  value={teamFormData.meet_location} 
                  onChange={(e) => setTeamFormData({...teamFormData, meet_location: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="例如：学校北门"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  集合点纬度
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={teamFormData.meet_lat} 
                  onChange={(e) => setTeamFormData({...teamFormData, meet_lat: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="39.9042"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  集合点经度
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={teamFormData.meet_lng} 
                  onChange={(e) => setTeamFormData({...teamFormData, meet_lng: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                    background: '#F8FAFC',
                    '&:focus': {
                      background: '#fff',
                      borderColor: 'var(--ustc-blue)',
                      boxShadow: '0 0 0 3px rgba(0, 65, 145, 0.1)',
                      outline: 'none'
                    }
                  }}
                  placeholder="116.4074"
                />
              </div>
              
              <div style={{ 
                gridColumn: 'span 2', 
                display: 'flex', 
                gap: '16px', 
                justifyContent: 'flex-end',
                marginTop: '8px' 
              }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowTeamForm(null)
                    setTeamFormData({
                      title: '',
                      description: '',
                      start_time: '',
                      end_time: '',
                      meet_location: '',
                      meet_lat: '',
                      meet_lng: ''
                    })
                  }}
                  style={{
                    padding: '12px 24px', 
                    backgroundColor: '#f8fafc', 
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#e2e8f0',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  取消
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '12px 32px', 
                    backgroundColor: 'var(--ustc-blue)', 
                    color: 'white',
                    border: 'none', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'var(--ustc-blue-dark)',
                      transform: 'translateY(-2px)',
                      boxShadow: 'var(--shadow-lg)'
                    },
                    '&:active': {
                      transform: 'translateY(0)'
                    }
                  }}
                >
                  创建公益团队
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="project-list" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '24px' 
        }}>
          {projects.length > 0 ? (
            projects.map(project => (
              <div key={project.id} className="project-card" style={{ 
                padding: '24px', 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                overflow: 'hidden'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                e.currentTarget.style.borderColor = 'var(--ustc-blue)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '4px', 
                  background: 'linear-gradient(90deg, var(--ustc-blue) 0%, var(--ustc-gold) 100%)' 
                }}></div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '16px',
                  position: 'relative'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <Heart size={18} style={{ color: '#ef4444', marginRight: '4px' }} />
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '24px', 
                        fontWeight: '700', 
                        color: 'var(--ustc-blue)',
                        lineHeight: '1.3',
                        marginRight: '12px' 
                      }}>
                        {project.title}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#fef3c7',
                        color: '#d97706',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}>
                        {getProjectTypeLabel(project.project_type)}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px', 
                      color: 'var(--text-secondary)', 
                      fontSize: '14px', 
                      marginBottom: '8px' 
                    }}>
                      {project.lat && project.lng && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px' 
                        }}>
                          <MapPin size={16} style={{ color: 'var(--ustc-gold)' }} />
                          <span style={{ 
                            fontWeight: '500',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' 
                          }}>
                            {project.location_name || project.address}
                          </span>
                        </div>
                      )}
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px' 
                      }}>
                        <Award size={16} style={{ color: 'var(--ustc-blue)' }} />
                        <span style={{ fontWeight: '500' }}>
                          创建于 {new Date(project.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-primary)', 
                  lineHeight: '1.6', 
                  marginBottom: '20px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: '3',
                  WebkitBoxOrient: 'vertical'
                }}>
                  {project.description || '暂无项目描述'}
                </p>
                
                {project.lat && project.lng && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setNavTarget({ 
                        lat: project.lat!, 
                        lng: project.lng!, 
                        address: project.address || project.location_name || '', 
                        name: project.location_name || project.title 
                      });
                    }}
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '10px 16px', 
                      backgroundColor: '#eff6ff', 
                      color: 'var(--ustc-blue)',
                      border: 'none', 
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      marginBottom: '20px',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Navigation size={16} />
                    导航至项目地点
                  </button>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '16px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    {project.contact_name && (
                      <div>联系人：{project.contact_name}</div>
                    )}
                    {project.contact_phone && (
                      <div>电话：{project.contact_phone}</div>
                    )}
                    {project.contact_email && (
                      <div>邮箱：{project.contact_email}</div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setShowTeamForm({projectId: project.id, projectTitle: project.title})}
                    style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    backgroundColor: '#ecfdf5',
                    color: '#10b981',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  >
                    <Users size={16} />
                    发起团队
                  </button>
                </div>
                
                {/* 团队列表简化版 */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '15px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Users size={14} style={{ color: 'var(--ustc-blue)' }} />
                      参与团队
                    </h4>
                    <span style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)',
                      backgroundColor: '#eff6ff',
                      padding: '4px 10px',
                      borderRadius: '12px'
                    }}>
                      {teams[project.id]?.length || 0} 个团队
                    </span>
                  </div>
                  
                  {teams[project.id] && teams[project.id].length > 0 ? (
                    <div style={{ 
                      maxHeight: '200px',
                      overflowY: 'auto',
                      paddingRight: '8px'
                    }}>
                      {teams[project.id].map(team => (
                        <div key={team.id} style={{
                          padding: '12px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          marginBottom: '8px',
                          transition: 'all 0.2s ease'
                        }}>
                          <h5 style={{ 
                            margin: '0 0 6px 0', 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: 'var(--ustc-blue)'
                          }}>
                            {team.title}
                          </h5>
                          
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            color: 'var(--text-secondary)', 
                            fontSize: '12px', 
                            marginBottom: '8px' 
                          }}>
                            <Calendar size={13} style={{ color: 'var(--ustc-gold)' }} />
                            <span style={{ fontWeight: '500' }}>
                              {new Date(team.start_time).toLocaleString('zh-CN', { 
                                month: '2-digit', 
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleJoinTeam(team.id)}
                            style={{
                            width: '100%',
                            padding: '6px 12px',
                            backgroundColor: 'var(--ustc-blue)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                          }}
                          >
                            加入团队
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '16px',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px dashed var(--border-color)'
                    }}>
                      暂无团队
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              gridColumn: 'span -1', 
              textAlign: 'center', 
              padding: '80px 20px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-color)',
              borderStyle: 'dashed'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                margin: '0 auto 24px', 
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px'
              }}>
                ❤️
              </div>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '20px', 
                fontWeight: '700', 
                color: 'var(--text-primary)' 
              }}>
                暂无公益项目
              </h3>
              <p style={{ 
                margin: 0, 
                color: 'var(--text-secondary)', 
                fontSize: '16px',
                lineHeight: '1.6' 
              }}>
                还没有创建任何公益项目，快来创建第一个公益项目吧！
              </p>
              <button 
                onClick={() => setShowCreateForm(true)}
                style={{
                  marginTop: '24px',
                  padding: '12px 24px', 
                  backgroundColor: 'var(--ustc-blue)', 
                  color: 'white',
                  border: 'none', 
                  borderRadius: '12px', 
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--ustc-blue-dark)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--ustc-blue)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                <Plus size={16} style={{ marginRight: '8px' }} />
                创建第一个公益项目
              </button>
            </div>
          )}
        </div>
      </div>
      <NavigationModal isOpen={!!navTarget} onClose={() => setNavTarget(null)} target={navTarget} />
    </div>
  )
}
