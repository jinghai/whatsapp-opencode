# 生产环境
FROM node:18-alpine AS production

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

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

ENV SKIP_SETUP=true

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "try { process.kill(1, 0); process.exit(0); } catch (e) { process.exit(1); }"

CMD ["node", "src/index.js"]

# 开发环境
FROM node:18-alpine AS development

WORKDIR /app

# 安装所有依赖（包括devDependencies）
COPY package*.json ./
RUN npm ci

# 复制代码
COPY . .

# 创建目录
RUN mkdir -p auth logs media data

EXPOSE 3000

ENV SKIP_SETUP=true

CMD ["npm", "run", "dev"]
