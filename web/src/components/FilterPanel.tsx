import { useEffect, useState } from 'react'

export type Filters = {
  college?: string
  major?: string
  grade?: string
  industry?: string
  poi?: string
}

export default function FilterPanel(props: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const { filters, onChange } = props

  const handleChange = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value || undefined })
  }

  return (
    <div className="filter-grid">
      <div className="field">
        <label>学院</label>
        <select
          value={filters.college ?? ''}
          onChange={(e) => handleChange('college', e.target.value)}
        >
          <option value="">全部学院</option>
          <option value="计算机系">计算机系</option>
          <option value="金融学院">金融学院</option>
          <option value="管理学院">管理学院</option>
          <option value="经管学院">经管学院</option>
          <option value="材料学院">材料学院</option>
        </select>
      </div>
      <div className="field">
        <label>专业</label>
        <select
          value={filters.major ?? ''}
          onChange={(e) => handleChange('major', e.target.value)}
        >
          <option value="">全部专业</option>
          <option value="计算机">计算机</option>
          <option value="金融">金融</option>
          <option value="软件工程">软件工程</option>
          <option value="数据科学">数据科学</option>
          <option value="市场">市场</option>
        </select>
      </div>
      <div className="field">
        <label>入学年份</label>
        <select
          value={filters.grade ?? ''}
          onChange={(e) => handleChange('grade', e.target.value)}
        >
          <option value="">全部年份</option>
          {Array.from({ length: 8 }, (_, i) => 2015 + i).map(year => (
             <option key={year} value={String(year)}>{year}级</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>行业领域</label>
        <select
          value={filters.industry ?? ''}
          onChange={(e) => handleChange('industry', e.target.value)}
        >
          <option value="">全部领域</option>
          <option value="互联网">互联网</option>
          <option value="金融">金融</option>
          <option value="教育">教育</option>
          <option value="制造">制造</option>
          <option value="咨询">咨询</option>
        </select>
      </div>
    </div>
  )
}
