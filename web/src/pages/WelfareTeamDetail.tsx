import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Users, Calendar, Clock, Navigation, ArrowLeft } from 'lucide-react'
import { loadAMap } from '../lib/amap'
import { fetchWelfareProjectDetail, fetchWelfareTeamsByProject, fetchWelfareTeamMembers, joinWelfareTeam, WelfareProject, WelfareTeam, WelfareTeamMember } from '../lib/api'

export default function WelfareTeamDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<WelfareProject | null>(null)
  const [teams, setTeams] = useState<WelfareTeam[]>([])
  const [selectedTeam, setSelectedTeam] = useState<WelfareTeam | null>(null)
  const [teamMembers, setTeamMembers] = useState<WelfareTeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routePlan, setRoutePlan] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [joiningTeam, setJoiningTeam] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!projectId) {
        setError('Invalid project ID')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch project details
        const projectData = await fetchWelfareProjectDetail(parseInt(projectId))
        setProject(projectData)

        // Fetch teams for this project
        const teamsData = await fetchWelfareTeamsByProject(parseInt(projectId))
        setTeams(teamsData)

        // Auto-select first team if available
        if (teamsData.length > 0) {
          setSelectedTeam(teamsData[0])
        }
      } catch (err) {
        setError('Failed to load data: ' + (err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectId])

  useEffect(() => {
    if (selectedTeam) {
      const loadTeamMembers = async () => {
        try {
          const members = await fetchWelfareTeamMembers(selectedTeam.id)
          setTeamMembers(members)
        } catch (err) {
          console.error('Failed to load team members:', err)
        }
      }

      loadTeamMembers()
      fetchUserLocation()
    }
  }, [selectedTeam])

  const fetchUserLocation = () => {
    loadAMap().then((AMap) => {
      AMap.plugin(['AMap.Geolocation'], () => {
        const geolocation = new AMap.Geolocation({ enableHighAccuracy: true })
        geolocation.getCurrentPosition((status: string, result: any) => {
          if (status === 'complete') {
            const { position } = result
            setUserLocation([position.lng, position.lat])
          }
        })
      })
    })
  }

  const planRoute = async () => {
    if (!selectedTeam || !selectedTeam.meet_lat || !selectedTeam.meet_lng || !userLocation) {
      setError('无法规划路线：缺少起点或终点信息')
      return
    }

    try {
      setLoading(true)
      setRoutePlan(null)

      const AMap = await loadAMap()
      AMap.plugin(['AMap.Driving'], () => {
        const driving = new AMap.Driving({
          map: null, // We don't need to render on map, just get the data
          policy: AMap.DrivingPolicy.LEAST_TIME
        })

        driving.search(
          userLocation, // Origin: user's current location
          [selectedTeam.meet_lng, selectedTeam.meet_lat], // Destination: team meeting point
          (status: string, result: any) => {
            if (status === 'complete') {
              setRoutePlan(result)
            } else {
              setError('路线规划失败：' + result.info)
            }
            setLoading(false)
          }
        )
      })
    } catch (err) {
      setError('路线规划失败：' + (err as Error).message)
      setLoading(false)
    }
  }

  const handleJoinTeam = async (teamId: number) => {
    try {
      setJoiningTeam(teamId)
      // Get user ID from local storage or state (this would be implemented in a real app)
      const userId = 1 // Placeholder - in real app, get from authenticated user
      await joinWelfareTeam(teamId, userId)
      
      // Refresh team members
      const members = await fetchWelfareTeamMembers(teamId)
      setTeamMembers(members)
    } catch (err) {
      setError('加入队伍失败：' + (err as Error).message)
    } finally {
      setJoiningTeam(null)
    }
  }

  if (loading && !project) {
    return <div className="loading-container">加载中...</div>
  }

  if (error) {
    return <div className="error-container">{error}</div>
  }

  if (!project) {
    return <div className="error-container">项目不存在</div>
  }

  return (
    <div className="welfare-team-detail">
      <header className="team-detail-header">
        <button className="back-button" onClick={() => navigate('/welfare')}>
          <ArrowLeft size={20} /> 返回公益地图
        </button>
        <h1 className="project-title">{project.title}</h1>
        <div className="project-meta">
          <span className="project-type">{project.project_type}</span>
          <span className="project-location">
            <MapPin size={14} />
            {project.location_name || project.address}
          </span>
        </div>
      </header>

      <main className="team-detail-main">
        <section className="project-info">
          <h2>项目详情</h2>
          <div className="project-description">{project.description || '暂无描述'}</div>
          <div className="project-contact">
            <h3>联系方式</h3>
            <p>联系人：{project.contact_name || '未知'}</p>
            <p>电话：{project.contact_phone || '未知'}</p>
            {project.contact_email && <p>邮箱：{project.contact_email}</p>}
          </div>
        </section>

        <section className="teams-section">
          <h2>参与队伍</h2>
          {teams.length === 0 ? (
            <div className="no-teams">暂无队伍，快来创建第一个队伍吧！</div>
          ) : (
            <div className="teams-list">
              {teams.map(team => (
                <div 
                  key={team.id} 
                  className={`team-card ${selectedTeam?.id === team.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="team-header">
                    <h3>{team.title}</h3>
                    <button 
                      className="join-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleJoinTeam(team.id)
                      }}
                      disabled={joiningTeam === team.id}
                    >
                      {joiningTeam === team.id ? '加入中...' : '加入队伍'}
                    </button>
                  </div>
                  <div className="team-info">
                    <p><Calendar size={16} /> 开始时间：{team.start_time}</p>
                    {team.end_time && <p><Clock size={16} /> 结束时间：{team.end_time}</p>}
                    <p><MapPin size={16} /> 集合地点：{team.meet_location || '未知'}</p>
                  </div>
                  <div className="team-meta">
                    <span className="member-count">
                      <Users size={14} /> {teamMembers.length} 人已加入
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {selectedTeam && (
          <section className="selected-team-details">
            <h2>队伍详情：{selectedTeam.title}</h2>
            <div className="team-description">{selectedTeam.description || '暂无描述'}</div>
            
            <h3>集合信息</h3>
            <div className="meeting-info">
              <p><Calendar size={16} /> 日期：{new Date(selectedTeam.start_time).toLocaleDateString()}</p>
              <p><Clock size={16} /> 时间：{new Date(selectedTeam.start_time).toLocaleTimeString()}</p>
              <p><MapPin size={16} /> 地点：{selectedTeam.meet_location || '未知'}</p>
            </div>

            <div className="team-actions">
              <button 
                className="route-button"
                onClick={planRoute}
                disabled={loading || !userLocation}
              >
                <Navigation size={16} /> 规划前往路线
              </button>
            </div>

            {routePlan && (
              <div className="route-plan">
                <h3>路线规划</h3>
                {routePlan.routes && routePlan.routes.length > 0 && (
                  <div className="route-details">
                    <p>预计耗时：{Math.round(routePlan.routes[0].time / 60)} 分钟</p>
                    <p>距离：{(routePlan.routes[0].distance / 1000).toFixed(1)} 公里</p>
                    <h4>导航步骤：</h4>
                    <ol className="route-steps">
                      {routePlan.routes[0].steps.map((step: any, index: number) => (
                        <li key={index} className="route-step">
                          {step.instructions}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            <h3>队伍成员</h3>
            {teamMembers.length === 0 ? (
              <div className="no-members">暂无成员</div>
            ) : (
              <div className="members-list">
                {teamMembers.map((member, index) => (
                  <div key={index} className="member-item">
                    <div className="member-avatar">
                      {String.fromCharCode(65 + (member.user_id % 26))} {/* Simple avatar: A-Z based on user ID */}
                    </div>
                    <div className="member-info">
                      <p className="member-name">成员 {member.user_id}</p>
                      <p className="member-joined">加入时间：{new Date(member.joined_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <style jsx>{`
        .welfare-team-detail {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .team-detail-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eaeaea;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #1890ff;
          font-size: 16px;
          cursor: pointer;
          margin-bottom: 15px;
        }

        .back-button:hover {
          text-decoration: underline;
        }

        .project-title {
          font-size: 28px;
          margin: 0 0 10px 0;
          color: #333;
        }

        .project-meta {
          display: flex;
          gap: 20px;
          font-size: 14px;
          color: #666;
        }

        .project-type {
          background: #f0f9eb;
          color: #52c41a;
          padding: 4px 12px;
          border-radius: 12px;
        }

        .project-location {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .team-detail-main {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }

        h2 {
          font-size: 20px;
          color: #333;
          margin-bottom: 15px;
          border-left: 4px solid #1890ff;
          padding-left: 12px;
        }

        h3 {
          font-size: 16px;
          color: #555;
          margin: 15px 0 10px 0;
        }

        .project-info {
          background: #fafafa;
          padding: 20px;
          border-radius: 8px;
        }

        .project-description {
          line-height: 1.6;
          color: #666;
          margin-bottom: 20px;
        }

        .project-contact {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #eaeaea;
        }

        .project-contact p {
          margin: 8px 0;
          color: #666;
        }

        .teams-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #eaeaea;
        }

        .no-teams {
          text-align: center;
          color: #999;
          padding: 40px 0;
        }

        .teams-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .team-card {
          background: #fafafa;
          border: 1px solid #eaeaea;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .team-card:hover {
          border-color: #1890ff;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
        }

        .team-card.selected {
          border-color: #1890ff;
          background: #e6f7ff;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .team-header h3 {
          margin: 0;
          font-size: 18px;
        }

        .join-button {
          background: #52c41a;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s ease;
        }

        .join-button:hover:not(:disabled) {
          background: #73d13d;
        }

        .join-button:disabled {
          background: #d9d9d9;
          cursor: not-allowed;
        }

        .team-info {
          margin-bottom: 10px;
        }

        .team-info p {
          margin: 6px 0;
          color: #666;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .team-meta {
          display: flex;
          justify-content: flex-end;
          font-size: 13px;
          color: #999;
        }

        .member-count {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .selected-team-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #eaeaea;
        }

        .team-description {
          line-height: 1.6;
          color: #666;
          margin-bottom: 20px;
        }

        .meeting-info {
          background: #fafafa;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .meeting-info p {
          margin: 8px 0;
          color: #666;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .team-actions {
          margin-bottom: 20px;
        }

        .route-button {
          background: #1890ff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s ease;
        }

        .route-button:hover:not(:disabled) {
          background: #40a9ff;
        }

        .route-button:disabled {
          background: #d9d9d9;
          cursor: not-allowed;
        }

        .route-plan {
          background: #f0f9eb;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .route-details {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e6f7ff;
        }

        .route-details p {
          margin: 8px 0;
          color: #555;
        }

        .route-steps {
          padding-left: 20px;
          margin: 15px 0;
        }

        .route-step {
          margin: 8px 0;
          color: #666;
          line-height: 1.5;
        }

        .members-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
        }

        .member-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fafafa;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #eaeaea;
        }

        .member-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #1890ff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .member-info {
          flex: 1;
        }

        .member-name {
          font-weight: 500;
          color: #333;
          margin: 0 0 4px 0;
          font-size: 14px;
        }

        .member-joined {
          color: #999;
          font-size: 12px;
          margin: 0;
        }

        .no-members {
          text-align: center;
          color: #999;
          padding: 30px 0;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
          color: #666;
        }

        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
          color: #ff4d4f;
          background: #fff1f0;
          border: 1px solid #ffccc7;
          border-radius: 8px;
          margin: 20px;
        }
      `}</style>
    </div>
  )
}