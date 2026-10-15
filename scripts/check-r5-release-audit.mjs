import assert from 'node:assert/strict'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Read-only metadata audit. No credentials, user rows or remote mutations.
const out = 'docs/qa/r5-block-10'
const catalog = JSON.parse(await readFile(`${out}/catalog.json`, 'utf8')).rows[0].metadata
const results = []
const check = (name, condition) => { assert.ok(condition, name); results.push({ name, result: 'PASS' }) }
const files = (await readdir('supabase/migrations')).filter(name => name.endsWith('.sql')).sort()
check('Remote migration versions equal all versioned migrations', JSON.stringify(catalog.migrations.map(row => row.version)) === JSON.stringify(files.map(name => name.split('_')[0])))
check('All public tables have RLS', catalog.tables.filter(row => row.schema === 'public').every(row => row.rls))
check('Realtime publishes only messages and notifications; no profiles/follows/blocks', JSON.stringify(catalog.publications.map(row => row.tablename).sort()) === JSON.stringify(['messages', 'notifications']))
check('Realtime message columns exclude profile data', JSON.stringify(catalog.publications.find(row => row.tablename === 'messages').attnames) === JSON.stringify(['id', 'conversation_id', 'sender_id', 'body', 'created_at']))
check('Only owner SELECT policy on profiles', catalog.policies.filter(row => row.tablename === 'profiles' && row.cmd === 'SELECT').every(row => row.policyname === 'profiles_select_own' && row.qual.includes('auth.uid()') && row.qual.includes('= id')))
const signing = catalog.functions.find(row => row.name === 'get_social_avatar_for_signing')
check('Social signing function cannot be executed by anon/authenticated', signing && !signing.anon_execute && !signing.authenticated_execute)
check('Avatar bucket private and limited to approved image MIME/5MiB', catalog.buckets.some(row => row.id === 'avatars' && !row.public && row.file_size_limit === 5242880 && JSON.stringify(row.allowed_mime_types) === JSON.stringify(['image/jpeg', 'image/png', 'image/webp'])))
const functions = JSON.parse(await readFile(`${out}/functions.json`, 'utf8'))
check('Avatar Edge function listed ACTIVE (inventory only, not functional proof)', functions.some(row => row.slug === 'social-avatar' && row.status === 'ACTIVE'))
const sw = await readFile('dist/sw.js', 'utf8')
check('Built service worker has no Supabase caching route', !sw.includes('supabase.co') && !sw.includes('NetworkFirst') && !sw.includes('StaleWhileRevalidate'))
const hash = value => createHash('sha256').update(value).digest('hex')
const mockup = await readFile('docs/design/mockups/release-5.png')
const envCopy = await readFile('.env.local')
check('Local configuration copied byte-for-byte from main checkout', hash(envCopy) === hash(await readFile('../mapbox-worktree/.env.local')))
const input_hashes = {}
for (const path of ['src/components/FollowButton.tsx', 'src/components/GradientButton.tsx', 'src/features/social/api.ts', 'src/styles/amanecer.css', 'vite.config.ts', 'package-lock.json', 'dist/index.html', 'dist/sw.js']) input_hashes[path] = hash(await readFile(path))
await writeFile(`${out}/security-audit.json`, JSON.stringify({ date: new Date().toISOString(), environment: 'Current remote READ ONLY catalog + local build inspection; no functional JWT/Realtime/Storage delivery proof', remote_version: catalog.server_version, migrations: files.length, public_rls_tables: catalog.tables.length, functions: catalog.functions.length, mockup_sha256: hash(mockup), input_hashes, results, result: 'PASS' }, null, 2) + '\n')
console.log(`PASS: ${results.length} metadata/build checks`)
