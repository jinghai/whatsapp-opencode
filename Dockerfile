# 生产环境
FROM node:18-alpine AS production

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制代码
COPY . .

# 创建目录
RUN mkdir -p auth logs media data

# 非root用户运行
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bridge -u 1001
RUN chown -R bridge:nodejs /app
USER bridge

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "src/bridge.js"]

# 开发环境
FROM node:18-alpine AS development

WORKDIR /app

# 安装所有依赖（包括devDependencies）
COPY package*.json ./
RUN npm install

# 复制代码
COPY . .

# 创建目录
RUN mkdir -p auth logs media data

EXPOSE 3000

CMD ["npm", "run", "dev"]
