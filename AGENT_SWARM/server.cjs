/**
 * Agent Swarm Command Center Server
 * Serves the dashboard + handles chat persistence
 * 
 * Start: node AGENT_SWARM/server.js
 * Open: http://localhost:3456
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')
const { execSync } = require('child_process')

const PORT = 3456
const CHAT_FILE = path.join(__dirname, 'shared', 'CHAT.md')
const DASHBOARD_FILE = path.join(__dirname, 'dashboard.html')
const SWARM_DIR = path.join(__dirname, '..', 'AGENT_SWARM')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

function ensureChatFile() {
  const dir = path.dirname(CHAT_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(CHAT_FILE)) {
    fs.writeFileSync(CHAT_FILE, '# User-Orchestrator Chat\n\n', 'utf-8')
  }
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath)
  const contentType = MIME_TYPES[ext] || 'text/plain'
  
  fs.readFile(filePath, 'utf-8', (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
      return
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
    res.end(content)
  })
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true)
  const pathname = parsed.pathname

  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // API: Get chat messages
  if (pathname === '/api/chat' && req.method === 'GET') {
    ensureChatFile()
    fs.readFile(CHAT_FILE, 'utf-8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Failed to read chat' }))
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ messages: data, timestamp: Date.now() }))
    })
    return
  }

  // API: Send chat message
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body)
        if (!message || !message.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Message is required' }))
          return
        }

        ensureChatFile()
        const timestamp = new Date().toLocaleTimeString()
        const line = `- **USER [${timestamp}]:** ${message.trim()}\n`
        fs.appendFile(CHAT_FILE, line, 'utf-8', err => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Failed to save' }))
            return
          }
          // Also log to orchestrator-visible console
          console.log(`\n💬 USER: ${message.trim()}\n`)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, timestamp }))
        })
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
    return
  }

  // API: Get task board status
  if (pathname === '/api/tasks' && req.method === 'GET') {
    const taskFile = path.join(SWARM_DIR, 'TASK_BOARD.md')
    fs.readFile(taskFile, 'utf-8', (err, data) => {
      if (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ tasks: '', error: 'No task board yet' }))
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ tasks: data, timestamp: Date.now() }))
    })
    return
  }

  // API: Get agent status (uses git changes + file metrics)
  if (pathname === '/api/agents' && req.method === 'GET') {
    const projectDir = path.resolve(__dirname, '..')

    // Agent file ownership mapping
    const agentOwnership = {
      'agent_1_data': ['src/store/', 'src/types/', 'src/utils/', 'src/hooks/'],
      'agent_2_engines': ['src/engines/', 'src/workers/'],
      'agent_3_pages': ['src/pages/'],
      'agent_4_quality': ['src/components/', 'src/test/', '.eslintrc', '.prettierrc'],
      'agent_5_infra': ['.github/', 'src-tauri/', 'scripts/', 'README.md', 'CONTRIBUTING.md', 'AGENTS.md'],
    }

    // Get git changes for each agent
    const results = []
    for (const [agentId, ownedPaths] of Object.entries(agentOwnership)) {
      let changes = 0
      let lastActivity = null

      try {
        const gitOutput = execSync(
          `git diff --name-only HEAD -- ${ownedPaths.join(' ')}`,
          { cwd: projectDir, encoding: 'utf-8', timeout: 5000 }
        )
        const changedFiles = gitOutput.split('\n').filter(Boolean)

        // Also check untracked files
        const untrackedOutput = execSync(
          `git ls-files --others --exclude-standard -- ${ownedPaths.join(' ')}`,
          { cwd: projectDir, encoding: 'utf-8', timeout: 5000 }
        )
        const untrackedFiles = untrackedOutput.split('\n').filter(Boolean)
        
        changes = changedFiles.length + untrackedFiles.length

        // Get last activity time from file mod times
        const allFiles = [...changedFiles, ...untrackedFiles]
        if (allFiles.length > 0) {
          let latest = 0
          for (const f of allFiles) {
            const fp = path.join(projectDir, f)
            try {
              const stat = fs.statSync(fp)
              if (stat.mtimeMs > latest) latest = stat.mtimeMs
            } catch {}
          }
          if (latest > 0) lastActivity = new Date(latest).toISOString()
        }
      } catch (e) {
        // git not available or no changes
      }

      // Count test files in agent domain
      let testCount = 0
      try {
        for (const p of ownedPaths) {
          const dirPath = path.join(projectDir, p)
          if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            const files = fs.readdirSync(dirPath, { recursive: true })
            testCount += files.filter(f => f.endsWith('.test.ts') || f.endsWith('.test.tsx')).length
          }
        }
      } catch {}

      results.push({
        agent: agentId,
        changes,
        lastActivity,
        testCount,
        ownedPaths,
        hasCurrentTask: fs.existsSync(path.join(SWARM_DIR, agentId, 'current_task.md')),
      })
    }

    // Count total test files in project
    let totalTests = 0
    try {
      const allTestFiles = execSync(
        `git ls-files --others --exclude-standard src/ && git diff --name-only HEAD -- src/`,
        { cwd: projectDir, encoding: 'utf-8', timeout: 5000 }
      ).split('\n').filter(Boolean)
      totalTests = allTestFiles.filter(f => f.endsWith('.test.ts')).length
    } catch {}

    // Get test pass count from cached result
    let testPassCount = 0
    try {
      const testOutput = execSync(
        `npx vitest run 2>&1 | findstr "Tests"`,
        { cwd: projectDir, encoding: 'utf-8', timeout: 30000 }
      )
      const match = testOutput.match(/(\d+)\s+passed/)
      if (match) testPassCount = parseInt(match[1])
    } catch {}

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      agents: results,
      totalTests,
      testPassCount,
      timestamp: Date.now()
    }))
    return
  }

  // Serve dashboard HTML
  if (pathname === '/' || pathname === '/index.html') {
    serveFile(res, DASHBOARD_FILE)
    return
  }

  // Serve static files from AGENT_SWARM/
  const filePath = path.join(SWARM_DIR, pathname)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath)
    return
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
})

ensureChatFile()

console.log(`
╔══════════════════════════════════════════════╗
║   🐝 Agent Swarm Command Center              ║
║                                              ║
║   Dashboard: http://localhost:${PORT}          ║
║   Chat with Orchestrator via the UI           ║
║                                              ║
║   Messages appear in AGENT_SWARM/shared/     ║
║   Orchestrator checks CHAT.md on each cycle   ║
║                                              ║
║   Press Ctrl+C to stop                       ║
╚══════════════════════════════════════════════╝
`)

server.listen(PORT)
