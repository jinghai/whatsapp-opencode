# 🔄 开发与发布流程

## 工作流程图

```
┌─────────────┐
│ 本地开发    │
│ (dev分支)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 本地测试    │
│ npm test    │
└──────┬──────┘
       │ 测试通过
       ▼
┌─────────────┐
│ 提交代码    │
│ git commit  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ GitHub PR   │
│ Code Review │
└──────┬──────┘
       │ Review通过
       ▼
┌─────────────┐
│ 合并到main  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ CI/CD 自动  │
│ 测试+发布   │
└─────────────┘
```

## 本地开发流程

### 1. 创建功能分支

```bash
# 从main创建功能分支
git checkout main
git pull origin main
git checkout -b feature/xxx
```

### 2. 本地开发测试

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 运行lint检查
npm run lint

# 本地运行测试
npm run dev
```

### 3. 测试清单

开发完成后，请检查：

- [ ] 文本消息功能正常
- [ ] 图片保存功能正常
- [ ] 语音转录功能正常
- [ ] 错误处理完善
- [ ] 日志输出清晰
- [ ] 代码通过lint检查
- [ ] 测试用例通过

### 4. 提交代码

```bash
# 提交代码
git add .
git commit -m "feat: 添加xxx功能

- 详细描述1
- 详细描述2
- 修复问题xxx"

# 推送到远程
git push origin feature/xxx
```

### 5. 创建Pull Request

在GitHub创建PR，填写：
- 功能描述
- 测试方法
- 截图（如有UI变更）

## 版本发布流程

### 版本号规则 (SemVer)

- `v1.0.0` - 主版本：重大变更
- `v1.1.0` - 次版本：新功能
- `v1.1.1` - 补丁版本：Bug修复

### 发布步骤

```bash
# 1. 确保在main分支且代码最新
git checkout main
git pull origin main

# 2. 运行完整测试
npm test
npm run lint

# 3. 更新版本号
npm version patch  # 或 minor / major

# 4. 推送标签
git push origin main --tags

# 5. GitHub Actions自动发布
```

## 自动化CI/CD

### 触发条件

1. **Push到main分支** - 运行测试
2. **创建Tag** - 运行测试 + 发布Release
3. **Pull Request** - 运行测试 + Code Review

### 自动检查项目

- ✅ ESLint代码规范
- ✅ 单元测试
- ✅ 集成测试
- ✅ 依赖安全扫描
- ✅ 代码覆盖率

## 本地开发环境

### 使用Docker（可选）

```bash
# 构建开发镜像
docker build -t opencode-whatsapp-bridge:dev .

# 运行开发容器
docker run -v $(pwd):/app -p 3000:3000 opencode-whatsapp-bridge:dev
```

### 使用PM2开发模式

```bash
# 开发模式（自动重启）
pm run dev

# 生产模式
npm start
```

## 回滚策略

如果发布版本有问题：

```bash
# 1. 回滚代码
git revert HEAD

# 2. 删除有问题的tag
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1

# 3. 发布补丁版本
npm version patch
git push origin main --tags
```

## 贡献指南

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` 新功能
- `fix:` Bug修复
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

### 示例

```bash
feat: 添加语音转文字功能

- 集成硅基流动SenseVoiceSmall API
- 支持MP3/OGG格式
- 添加错误重试机制

fix: 修复图片上传超时问题

- 增加超时时间到30秒
- 添加进度日志
```

## 监控和日志

### 生产环境监控

```bash
# 查看PM2日志
pm2 logs opencode-whatsapp

# 查看系统状态
pm2 monit

# 查看历史日志
cat logs/wa-bridge.log | tail -100
```

### 告警设置

- 服务宕机时发送邮件/钉钉
- 错误率超过阈值时告警
- 内存使用超过80%时告警

## 安全最佳实践

1. **敏感信息** - 使用环境变量，绝不提交到Git
2. **依赖安全** - 定期运行 `npm audit`
3. **代码审查** - 所有代码必须经过PR审查
4. **访问控制** - 使用白名单限制访问

---

**记住：先本地测试，再推送GitHub！** 🧪➡️🚀
