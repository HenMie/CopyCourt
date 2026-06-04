# 文案审判庭 CopyCourt

CopyCourt 是一个文案分析与改写工具。用户输入文案后，系统会生成立案摘要、检方控诉、辩方辩护、陪审团反馈、法官判决、优化改写稿，以及“原文基线分 vs 改写后复审分”的评分提升对照。

## 技术栈

- 前端：React + Vite
- 后端：FastAPI + Pydantic
- AI：OpenAI Responses API，使用 `POST /v1/responses` 和 `text.format` JSON Schema 结构化输出
- 部署：单 Docker 镜像，FastAPI 同时提供 API 与前端静态资源

## 项目边界

- 不做登录、数据库、历史记录、模板管理和导出能力
- 前端首屏即文案输入与分析结果工作区
- 审判结果固定包含 7 个分区：立案、控诉、辩护、陪审、判决、改写前后对照、复审评分提升

## Docker Compose 部署

```bash
cp .env.example .env
# 编辑 .env，至少填入 OPENAI_API_KEY
docker compose up --build
```

访问：

- 应用：http://localhost:3000
- 健康检查：http://localhost:3000/api/health

Compose 只启动一个 `app` 服务，镜像内由 FastAPI 同时提供 `/api/*` 接口和前端静态页面。默认端口是 `3000`；如果修改 `APP_PORT`，请同步调整 `FRONTEND_ORIGINS`。

## 使用 Docker Hub 镜像

```bash
docker pull chouann/copycourt:latest
docker run --rm -p 3000:3000 --env-file .env chouann/copycourt:latest
```

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `OPENAI_API_KEY` | 必填，OpenAI API key | 无 |
| `OPENAI_BASE_URL` | OpenAI 网关地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | 使用的模型名 | `gpt-5.5` |
| `OPENAI_TIMEOUT_SECONDS` | 上游超时时间 | `45` |
| `APP_PORT` | 本地暴露端口 | `3000` |
| `FRONTEND_ORIGINS` | API 允许的前端来源，逗号分隔 | `http://localhost:3000,http://127.0.0.1:3000` |

## 本地开发

后端：

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

前端：

```bash
cd frontend
npm install
npm run dev
```

本地开发如需让 Vite 直连单独启动的后端，可在启动前设置 `VITE_API_BASE_URL=http://localhost:8000`。Docker 镜像内默认使用同源 `/api`。

## 测试

后端：

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

前端：

```bash
cd frontend
npm install
npm test
npm run build
```

## 接口

`GET /api/health`

```json
{
  "status": "ok",
  "service": "copycourt-app"
}
```

`POST /api/trials`

```json
{
  "original_text": "string, 20-3000 chars",
  "target_platform": "general | xiaohongshu | douyin | wechat | campus | ecommerce",
  "audience": "string, optional",
  "objective": "interest | trust | conversion | clarity | engagement",
  "intensity": "safe | balanced | bold"
}
```

`POST /api/trials` 响应关键结构：

```json
{
  "case_summary": {},
  "prosecution": [],
  "defense": [],
  "jury": [],
  "verdict": {},
  "rewritten_copy": {},
  "review_scores": {
    "original": {
      "clarity": 1,
      "appeal": 1,
      "authenticity": 1,
      "platform_fit": 1,
      "risk_control": 1
    },
    "revised": {
      "clarity": 1,
      "appeal": 1,
      "authenticity": 1,
      "platform_fit": 1,
      "risk_control": 1
    }
  }
}
```

前端会基于 `review_scores.original` 和 `review_scores.revised` 计算每项提升值与平均提升值。

AI 调用失败时，后端会返回统一错误结构：

```json
{
  "error": {
    "code": "missing_api_key",
    "message": "缺少 OPENAI_API_KEY，请在环境变量或 .env 中配置后重试。"
  }
}
```

## 真实 API 冒烟

填入真实 `OPENAI_API_KEY` 后，推荐至少跑一次：

- “课程介绍文案”示例：验证课堂场景表达优化
- “校园活动文案”示例：验证活动招募场景的钩子与行动号召

验收标准：

- 返回结果结构完整
- 陪审团固定为 5 个角色
- 改写前后对照可读
- 复审评分区域能展示原文、改写后和提升值
