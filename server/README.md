# 校友地理信息互动平台后端

- 技术栈: Node.js + Express + SQLite
- 功能: 身份注册登录、校友档案、条件筛选、周边匹配、隐私设置

## 环境
- 复制 `.env.example` 为 `.env` 并配置 `JWT_SECRET`

## 安装与启动
- 在 `server` 目录运行:
```
npm install
npm run start
```
- 健康检查: `GET http://localhost:3000/health`

## 主要接口
- `POST /auth/register`
- `POST /auth/login`
- `GET /alumni?college=&major=&industry=&city=&district=&lat=&lng=&radius_km=`
- `GET /alumni/nearby?lat=&lng&radius_km=5`
- `GET /alumni/:id`
- `PUT /alumni/:id/privacy` 需 `Authorization: Bearer <token>`
