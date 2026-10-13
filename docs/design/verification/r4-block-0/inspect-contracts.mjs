import { readFile, writeFile, readdir, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
const out=process.env.PLANIT_AUDIT_OUTPUT ?? 'docs/design/verification/r4-block-0'
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
if (sha !== '42af4e42d032637b1363e207714e86c297d8c3b1') throw new Error('Use the immutable audit base; run an updated audit separately')
let existing = false
try { await access(`${out}/sql-inventory.json`); existing = true } catch {}
if (existing) throw new Error('Choose a new PLANIT_AUDIT_OUTPUT; published evidence must not be overwritten')
await mkdir(out, { recursive:true })
const migrations=(await readdir('supabase/migrations')).filter(x=>x.endsWith('.sql')).sort()
const functions=new Map(), policies=new Map(), tables=new Set(), files=[]
const grants=[]
const clean=s=>s.replace(/\s+/g,' ').trim()
for(const name of migrations){
 const path=`supabase/migrations/${name}`,raw=await readFile(path),sql=raw.toString('utf8')
 files.push({path,bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')})
 for(const m of sql.matchAll(/create\s+table\s+(public\.\w+)/gi))tables.add(m[1])
 for(const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+([\w.]+)\s*\(([^]*?)\)\s*returns\s+([^]*?)\bas\s*\$\$([^]*?)\$\$\s*;/gi)){
  const header=m[3],body=m[4];functions.set(m[1],{name:m[1],parameters:clean(m[2]),returns:clean(header.split(/\blanguage\b/i)[0]),security:/security\s+definer/i.test(header)?'definer':'invoker',empty_search_path:/set\s+search_path\s*=\s*''/i.test(header),source:path,line:sql.slice(0,m.index).split('\n').length,dependencies:[...new Set([...body.matchAll(/\b(?:public|planit_private|storage)\.\w+/g)].map(x=>x[0]))].sort()})
 }
 for(const m of sql.matchAll(/(?:grant|revoke)\s+[^;]+\bon\s+function\s+[^;]+;/gi))grants.push({source:path,statement:clean(m[0])})
 for(const m of sql.matchAll(/(?:create\s+policy\s+(\w+)[^;]+;|drop\s+policy\s+(\w+)[^;]+;)/gi)){
  if(m[2])policies.delete(m[2]);else policies.set(m[1],{name:m[1],source:path,line:sql.slice(0,m.index).split('\n').length,statement:clean(m[0])})
 }
}
const defs=[...functions.values()].map(f=>({...f,execute_statements:grants.filter(g=>g.statement.includes(f.name+'('))}))
const artifact={sha,method:'Static extraction of committed migrations, not SQL replay nor remote catalog. Last definition per name; no overloads added in this base.',migrations:files,tables:[...tables].sort(),r4_tables_present:['public.event_access_links','public.event_access_grants','public.user_category_interests'].filter(t=>tables.has(t)),functions:defs,policies:[...policies.values()],function_grants:grants}
await writeFile(`${out}/sql-inventory.json`,JSON.stringify(artifact,null,2)+'\n')
console.log(JSON.stringify({migrations:migrations.length,tables:tables.size,publicFunctions:defs.filter(f=>f.name.startsWith('public.')).length,privateFunctions:defs.filter(f=>f.name.startsWith('planit_private.')).length,policies:policies.size,r4Tables:artifact.r4_tables_present}))
