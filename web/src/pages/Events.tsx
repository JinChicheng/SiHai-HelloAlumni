import { useEffect, useState } from 'react'
import { Calendar, MapPin, Navigation, Plus, Trash2 } from 'lucide-react'
import { fetchEvents, createEvent, deleteEvent, type EventItem } from '../lib/api'
import NavigationModal from '../components/NavigationModal'

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [navTarget, setNavTarget] = useState<{lat: number, lng: number, address: string, name: string} | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location_name: '',
    address: '',
    lat: '',
    lng: ''
  })

  useEffect(() => {
    fetchEvents().then(setEvents).finally(() => setLoading(false))
  }, [])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newEvent = await createEvent({
        ...formData,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null
      })
      setEvents([newEvent, ...events])
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location_name: '',
        address: '',
        lat: '',
        lng: ''
      })
    } catch (error) {
      alert('创建失败：' + (error as Error).message)
    }
  }

  const handleDeleteEvent = async (id: number) => {
    if (confirm('确定要删除这个活动吗？')) {
      try {
        await deleteEvent(id)
        setEvents(events.filter(ev => ev.id !== id))
      } catch (error) {
        alert('删除失败：' + (error as Error).message)
      }
    }
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
    <div className="events-page" style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
      padding: '40px 20px' 
    }}>
      <div className="container" style={{ 
        maxWidth: '1000px', 
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
              校友活动
            </h1>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-secondary)', 
              fontSize: '16px' 
            }}>
              发现并参与校友组织的精彩活动
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
            <Plus size={18} />
            {showCreateForm ? '取消创建' : '创建活动'}
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
              创建新活动
            </h2>
            <form onSubmit={handleCreateEvent} style={{ 
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
                  活动标题 *
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
                  placeholder="输入活动标题"
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
                  活动描述
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
                  placeholder="详细描述活动内容、流程和亮点"
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
                  value={formData.start_time} 
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
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
                  value={formData.end_time} 
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
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
                  placeholder="例如：校友活动中心"
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
                  placeholder="例如：北京市海淀区中关村南大街5号"
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
                  创建活动
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="event-list" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '24px' 
        }}>
          {events.length > 0 ? (
            events.map(ev => (
              <div key={ev.id} className="event-card" style={{ 
                padding: '24px', 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 'var(--shadow-xl)',
                  borderColor: 'var(--ustc-blue)'
                }
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
                  marginBottom: '16px' 
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '20px', 
                    fontWeight: '700', 
                    color: 'var(--ustc-blue)',
                    lineHeight: '1.3',
                    flex: 1,
                    marginRight: '12px' 
                  }}>
                    {ev.title}
                  </h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(ev.id);
                    }}
                    style={{
                      color: '#ef4444', 
                      backgroundColor: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      padding: '6px 10px', 
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      opacity: 0.7,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.opacity = '0.7';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  color: 'var(--text-secondary)', 
                  fontSize: '14px', 
                  marginBottom: '12px' 
                }}>
                  <Calendar size={16} style={{ color: 'var(--ustc-blue)' }} />
                  <span style={{ fontWeight: '500' }}>
                    {new Date(ev.start_time).toLocaleString('zh-CN', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {ev.end_time && (
                    <>
                      <span> - </span>
                      <span>
                        {new Date(ev.end_time).toLocaleString('zh-CN', { 
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </>
                  )}
                </div>
                
                {ev.address && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    color: 'var(--text-secondary)', 
                    fontSize: '14px', 
                    marginBottom: '16px' 
                  }}>
                    <MapPin size={16} style={{ color: 'var(--ustc-gold)' }} />
                    <span style={{ 
                      fontWeight: '500',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' 
                    }}>
                      {ev.location_name || ev.address}
                    </span>
                  </div>
                )}
                
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
                  {ev.description || '暂无活动描述'}
                </p>
                
                {ev.lat && ev.lng && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setNavTarget({ 
                        lat: ev.lat!, 
                        lng: ev.lng!, 
                        address: ev.address || ev.location_name || '', 
                        name: ev.location_name || ev.title 
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
                    导航至活动地点
                  </button>
                )}
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
                📅
              </div>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '20px', 
                fontWeight: '700', 
                color: 'var(--text-primary)' 
              }}>
                暂无活动
              </h3>
              <p style={{ 
                margin: 0, 
                color: 'var(--text-secondary)', 
                fontSize: '16px',
                lineHeight: '1.6' 
              }}>
                还没有创建任何校友活动，快来创建第一个活动吧！
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
                创建第一个活动
              </button>
            </div>
          )}
        </div>
      </div>
      <NavigationModal isOpen={!!navTarget} onClose={() => setNavTarget(null)} target={navTarget} />
    </div>
  )
}
