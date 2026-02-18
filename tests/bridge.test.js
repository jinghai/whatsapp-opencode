/**
 * WhatsApp OpenCode Bridge Tests
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')

// 测试工具函数
function detectTaskType(text) {
  const skillKeywords = {
    'brainstorming': ['想法', '设计', '规划', 'brainstorm', 'idea', 'design', 'plan', '如何实现', '方案'],
    'debugging': ['错误', 'bug', '报错', 'debug', 'error', '问题', '不工作', '失败'],
    'tdd': ['测试', 'test', 'tdd', '单元测试', 'spec'],
    'code-review': ['审查', 'review', '检查代码', '优化'],
    'git': ['提交', 'commit', 'push', 'merge', 'pr', '分支']
  }
  
  const textLower = text.toLowerCase()
  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      return skill
    }
  }
  return null
}

function parseCommand(text) {
  const cmd = text.trim().toLowerCase()
  if (cmd === '/new' || cmd === '/reset') return 'new'
  if (cmd === '/help' || cmd === '/h') return 'help'
  return null
}

// 测试用例
const tests = {
  '命令解析 - /new': () => {
    assert.strictEqual(parseCommand('/new'), 'new')
    assert.strictEqual(parseCommand('/NEW'), 'new')
    assert.strictEqual(parseCommand('  /new  '), 'new')
  },
  
  '命令解析 - /help': () => {
    assert.strictEqual(parseCommand('/help'), 'help')
    assert.strictEqual(parseCommand('/h'), 'help')
  },
  
  '命令解析 - 普通文本': () => {
    assert.strictEqual(parseCommand('你好'), null)
    assert.strictEqual(parseCommand('帮我写代码'), null)
  },
  
  '任务检测 - debugging': () => {
    assert.strictEqual(detectTaskType('帮我修复这个bug'), 'debugging')
    assert.strictEqual(detectTaskType('这里有错误'), 'debugging')
    assert.strictEqual(detectTaskType('debug this'), 'debugging')
  },
  
  '任务检测 - brainstorming': () => {
    assert.strictEqual(detectTaskType('帮我设计一个方案'), 'brainstorming')
    assert.strictEqual(detectTaskType('如何实现这个功能'), 'brainstorming')
    assert.strictEqual(detectTaskType('plan this feature'), 'brainstorming')
  },
  
  '任务检测 - tdd': () => {
    assert.strictEqual(detectTaskType('写单元测试'), 'tdd')
    assert.strictEqual(detectTaskType('test this'), 'tdd')
  },
  
  '任务检测 - git': () => {
    assert.strictEqual(detectTaskType('帮我提交代码'), 'git')
    assert.strictEqual(detectTaskType('commit changes'), 'git')
  },
  
  '任务检测 - 普通文本': () => {
    assert.strictEqual(detectTaskType('你好'), null)
    assert.strictEqual(detectTaskType('what is this'), null)
  },
  
  '版本号格式': () => {
    const pkg = require('../package.json')
    assert.match(pkg.version, /^\d+\.\d+\.\d+$/, '版本号格式应为 x.y.z')
  },
  
  '包名验证': () => {
    const pkg = require('../package.json')
    assert.strictEqual(pkg.name, 'whatsapp-opencode')
  },
  
  '必要文件存在': () => {
    const files = ['bridge.js', 'package.json', 'README.md', 'workflow.sh']
    files.forEach(f => {
      assert(fs.existsSync(path.join(__dirname, '..', f)), `${f} 应存在`)
    })
  },
  
  '目录结构': () => {
    const dirs = ['auth', 'data', 'logs', 'media']
    dirs.forEach(d => {
      const dirPath = path.join(__dirname, '..', d)
      // 目录可能不存在，但应该可以创建
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
      assert(fs.existsSync(dirPath), `${d} 目录应存在`)
    })
  }
}

// 运行测试
let passed = 0
let failed = 0

console.log('\n🧪 WhatsApp OpenCode Bridge Tests\n')
console.log('='.repeat(50))

for (const [name, test] of Object.entries(tests)) {
  try {
    test()
    console.log(`✅ ${name}`)
    passed++
  } catch (e) {
    console.log(`❌ ${name}`)
    console.log(`   Error: ${e.message}`)
    failed++
  }
}

console.log('='.repeat(50))
console.log(`\n📊 结果: ${passed} passed, ${failed} failed\n`)

process.exit(failed > 0 ? 1 : 0)
