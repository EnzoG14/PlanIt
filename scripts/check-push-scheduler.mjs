import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'

// Real PostgreSQL; cron, Vault and HTTP are SQL doubles. No remote connection.
const root = resolve(process.env.PLANIT_TEST_TOOLS_DIR ?? '.participation-test-tools.local/node_modules')
const [{ default: pg }, { initdb, pg_ctl }] = await Promise.all([
  import(pathToFileURL(resolve(root, 'pg/lib/index.js')).href),
  import(pathToFileURL(resolve(root, '@embedded-postgres/windows-x64/dist/index.js')).href),
])
// Resolve on process exit; Windows server descendants can retain pipe handles.
const run = (file, args) => new Promise((resolveRun, reject) => {
  const child = spawn(file, args, { windowsHide: true, stdio: 'ignore' })
  child.on('error', reject)
  child.on('exit', code => code === 0 ? resolveRun() : reject(new Error(`PostgreSQL tool exited ${code}`)))
})
const directory = resolve(`.push-scheduler-${Date.now()}.local`)
const probe = createServer()
await new Promise(r => probe.listen(0, '127.0.0.1', r))
const port = probe.address().port
await new Promise(r => probe.close(r))
const db = new pg.Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres' })
let started = false
try {
  await mkdir(directory)
  await run(initdb, ['-D', directory, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C'], { windowsHide: true })
  await run(pg_ctl, ['-D', directory, '-l', `${directory}/server.log`, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], { windowsHide: true })
  started = true
  await db.connect()
  await db.query(`create role anon; create role authenticated; create role service_role;
    create schema vault; create schema cron; create schema net;
    create table vault.decrypted_secrets(name text, decrypted_secret text);
    create table cron.job(jobname text primary key, schedule text, command text);
    create function cron.schedule(text,text,text) returns bigint language plpgsql as $$
      begin insert into cron.job values($1,$2,$3) on conflict(jobname)
      do update set schedule=excluded.schedule,command=excluded.command; return 1; end $$;
    create table net.http_request_queue(url text,headers jsonb,body jsonb,timeout integer);
    create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer)
      returns bigint language plpgsql as $$ begin
        insert into net.http_request_queue values(url,headers,body,timeout_milliseconds); return 1; end $$;
    grant usage on schema net to public;
    grant select on net.http_request_queue to public;`)
  const source = await readFile('supabase/operations/enable-push-scheduler.sql', 'utf8')
  const sql = source.replace(/^create extension[^;]+;$/gm, '')
  const rejected = async command => {
    await assert.rejects(db.query(command), /push_scheduler_vault_unconfigured/)
    await db.query('rollback')
  }
  await rejected(sql)
  const url = 'https://iepeqmvzjguwlhnecsdq.supabase.co/functions/v1/r7-push'
  const token = 'A'.repeat(43)
  await db.query('insert into vault.decrypted_secrets values ($1,$2),($3,$4)',
    ['planit_push_worker_url', url, 'planit_push_worker_token', 'invalid'])
  await rejected(sql)
  await db.query("update vault.decrypted_secrets set decrypted_secret=$1 where name='planit_push_worker_token'", [token])
  await db.query("update vault.decrypted_secrets set decrypted_secret='https://example.com' where name='planit_push_worker_url'")
  await rejected(sql)
  await db.query("update vault.decrypted_secrets set decrypted_secret=$1 where name='planit_push_worker_url'", [url])
  await db.query(sql)
  await db.query(sql)
  const jobs = (await db.query('select * from cron.job')).rows
  assert.equal(jobs.length, 1)
  assert.equal(jobs[0].schedule, '10 seconds')
  assert.equal(jobs[0].command.includes(token), false)
  await db.query(jobs[0].command)
  const request = (await db.query('select * from net.http_request_queue')).rows[0]
  assert.equal(request.url, url)
  assert.equal(request.headers.Authorization, `Bearer ${token}`)
  assert.equal(request.timeout, 55000)
  const rotated = 'B'.repeat(43)
  await db.query("update vault.decrypted_secrets set decrypted_secret=$1 where name='planit_push_worker_token'", [rotated])
  await db.query(jobs[0].command)
  assert.equal((await db.query('select headers from net.http_request_queue')).rows[1].headers.Authorization, `Bearer ${rotated}`)
  await db.query("update vault.decrypted_secrets set decrypted_secret='https://example.com' where name='planit_push_worker_url'")
  await rejected(jobs[0].command)
  assert.equal(Number((await db.query('select count(*) from net.http_request_queue')).rows[0].count), 2)
  console.log('PASS: missing/invalid Vault rejected; fixed URL; named job updated; dispatch uses current token; URL tampering blocked.')
  console.log('LIMIT: PostgreSQL with SQL doubles; extension installation, real scheduling and physical delivery require remote verification after approval.')
} finally {
  await db.end().catch(() => {})
  if (started) await run(pg_ctl, ['-D', directory, '-m', 'fast', '-w', 'stop'], { windowsHide: true })
}
