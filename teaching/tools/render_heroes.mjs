import fs from 'node:fs';
const root=new URL('../',import.meta.url),catalog=JSON.parse(fs.readFileSync(new URL('course.json',root),'utf8'));
const results=[];
for(const entry of catalog){
  if(entry.id==='E03')continue;
  const html=fs.readFileSync(new URL(entry.slug+'/index.html',root),'utf8');
  const config=JSON.parse(html.match(/<script id="lesson-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  const model=await import(new URL(entry.slug+'/model.js',root));
  const result=await model.compute(config.defaults);
  let plot=result.plots.find(p=>p.kind==='image')||result.plots[0];
  if(entry.id==='E07')plot=result.plots[1];
  if(entry.id==='E06')plot=result.plots[2];
  results.push({slug:entry.slug,plot});
}
fs.mkdirSync(new URL('.qa/',root),{recursive:true});
fs.writeFileSync(new URL('.qa/heroes.json',root),JSON.stringify(results));
