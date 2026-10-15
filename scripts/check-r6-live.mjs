import {stage,evidence} from './r6-live/common.mjs'
const names={prepare:'prepare',http:'http',realtime:'realtime',ui:'ui',native:'native',browser:'browser',close:'close'}
try{if(!names[stage])throw new Error('Choose prepare/http/realtime/ui/native/browser/close');const m=await import(`./r6-live/${names[stage]}.mjs`);await m[names[stage]]()}
catch(error){await evidence(stage+'-execution-error',[{test:`${stage} execution`,result:'FAIL',reason:error.message?.slice(0,250),code:error.code??error.name}]);process.exitCode=1}
