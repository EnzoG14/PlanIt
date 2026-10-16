// Manual server-side invocation. Load the ignored secrets file with Node's
// --env-file option; never pass the token on the command line or into VITE_*.
const token = process.env.PUSH_WORKER_TOKEN
if (!token) throw new Error('PUSH_WORKER_TOKEN is required in the local server environment')
const response = await fetch('https://iepeqmvzjguwlhnecsdq.supabase.co/functions/v1/r7-push', {
  method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(60000),
})
const result = await response.json()
// The worker response is an allowlisted aggregate report, never delivery data.
console.log(JSON.stringify({ status: response.status, ...result }, null, 2))
if (!response.ok) process.exitCode = 1
