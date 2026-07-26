#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
function git(args){return execFileSync('git',args,{encoding:'utf8'}).trim();}
function list(args){const out=git(args); return out?out.split('\n').filter(Boolean):[];}
const bannedPrefixes=['src-tauri/target/','dist/','build/','coverage/','bundle-report/','graphify-out/','src/graphify-out/','docs/drafts/','memory/','.openhands/','.openclaude/','.claude-flow/','.swarm/','.hermes/','.obsidian/','.planning/','_TEMP_ACTIVE/','AGENT_SWARM/','.agents/','.a5c/','hive/','server/data/'];
const tracked=list(['ls-files']);
const trackedIgnored=list(['ls-files','-ci','--exclude-standard']);
const banned=tracked.filter(f=>bannedPrefixes.some(p=>f.startsWith(p))||/\.(db|db-shm|db-wal|bak|backup)$/.test(f)||(!f.includes('/')&&(/^(vitest|tsc).*\.txt$/.test(f)||/^test-output\.txt$/.test(f)||/^memdir.*\.txt$/.test(f))));
let failed=false;
if(trackedIgnored.length){failed=true; console.error('Tracked ignored files:'); trackedIgnored.slice(0,100).forEach(f=>console.error('  '+f));}
if(banned.length){failed=true; console.error('Banned generated/scratch files tracked:'); banned.slice(0,100).forEach(f=>console.error('  '+f));}
const large=[]; for(const f of tracked){ if(existsSync(f)){ const s=statSync(f).size; if(s>1024*1024) large.push([f,s]);}}
if(large.length){console.warn('Large tracked file warnings (>1 MiB):'); large.slice(0,50).forEach(([f,s])=>console.warn(`  ${(s/1024/1024).toFixed(2)} MiB  ${f}`));}
if(failed){process.exit(1);} console.log(`Repository hygiene check passed: ${tracked.length} tracked files, ${trackedIgnored.length} tracked ignored files.`);
