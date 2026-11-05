const a=JSON.parse(require('fs').readFileSync('server/db/data/monuments-lumbini-madhesh.json','utf8'));
const [i,np]=[+process.argv[2],process.argv[3]==='np'];
const s=a[i];
if(!np){const o={...s};['quiz','clues','clues_np','gallery','sources','story_np','legend_np','facts_np','quake_np','short_np','model','image','coord_source','alt_names','lat','lng'].forEach(k=>delete o[k]);console.log(JSON.stringify(o));
s.quiz.forEach((q,j)=>console.log(j,q.q,'|',q.options.join(' / '),'| ans',q.answer_index,'|',q.explanation));console.log(s.clues.join('\n'))}
else{s.quiz.forEach((q,j)=>console.log(j,q.q_np,'|',q.options_np.join(' / '),'| ans',q.answer_index,'|',q.explanation_np));console.log(s.clues_np.join('\n'));console.log(s.story_np,s.facts_np.join(' ## '))}
