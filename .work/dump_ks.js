const d=JSON.parse(require('fs').readFileSync('server/db/data/monuments-karnali-sudurpashchim.json','utf8'));
const i=+process.argv[2];const s=d[i];
for(const k of ['name','city','district','type','built_year','built_century_text','dynasty','architecture','short','story','legend','facts','visit','earthquake_2015','festivals'])console.log(k+': '+JSON.stringify(s[k]));
console.log('CLUES');s.clues.forEach((c,j)=>console.log(j,c,'|',s.clues_np[j]));
console.log('QUIZ');s.quiz.forEach((q,j)=>{console.log(j,'D'+q.difficulty,q.q,JSON.stringify(q.options),'ANS',q.answer_index,'|',q.explanation);console.log('  NP',q.q_np,JSON.stringify(q.options_np),'|',q.explanation_np)});
