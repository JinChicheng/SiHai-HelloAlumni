import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchAlumniDetail, AlumniDetail } from '../lib/api'
import { ArrowLeft, MapPin, Briefcase, GraduationCap } from 'lucide-react'

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<AlumniDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchAlumniDetail(Number(id))
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) return <div className="loading-page">加载中...</div>
  if (!data) return <div className="error-page">未找到校友信息</div>

  return (
    <div className="profile-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> 返回
      </button>
      
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">{data.name[0]}</div>
          <div className="info">
            <h1>{data.name}</h1>
            <div className="tags">
               <span className="tag">{data.graduation_year}级</span>
               <span className="tag">{data.college}</span>
            </div>
          </div>
        </div>
        
        <div className="profile-section">
          <h2><GraduationCap size={18} /> 教育经历</h2>
          <div className="row">
            <label>学校</label> <span>{data.school || 'USTC'}</span>
          </div>
          <div className="row">
            <label>专业</label> <span>{data.major} ({data.degree})</span>
          </div>
        </div>

        <div className="profile-section">
          <h2><Briefcase size={18} /> 职业信息</h2>
          <div className="row">
             <label>公司</label> <span>{data.company || '未公开'}</span>
          </div>
          <div className="row">
             <label>职位</label> <span>{data.job_title || '未公开'}</span>
          </div>
          <div className="row">
             <label>行业</label> <span>{data.industry}</span>
          </div>
        </div>

        <div className="profile-section">
          <h2><MapPin size={18} /> 位置信息</h2>
          <div className="row">
             <label>常驻地</label> <span>{data.city} {data.district}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
