import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const skill=resolve(root,'skills/painted-animation');
const failures=[];
for(const f of ['SKILL.md','agents/openai.yaml','references/lyric-direction.md','references/music-video.md','scripts/new_project.mjs','template/LICENSE','template/ANIMATION_GUIDE.md','template/render.mjs']){
  if(!existsSync(resolve(skill,f)))failures.push(`Missing ${f}`);
}
for(const f of ['LICENSE','NOTICE.md','README.md'])if(!existsSync(resolve(root,f)))failures.push(`Missing ${f}`);
const files=[];
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){
  if(e.name==='.git')continue;
  const p=resolve(dir,e.name);
  if(e.isSymbolicLink()){failures.push(`Unexpected symlink: ${relative(root,p)}`);continue;}
  if(e.isDirectory()){
    if(['node_modules','out','video-tools','__pycache__'].includes(e.name)){failures.push(`Non-release directory: ${relative(root,p)}`);continue;}
    walk(p);
  }else files.push(p);
}}
walk(root);
for(const p of files){
  const f=relative(root,p);
  if(/\.(mp3|m4a|wav|mp4|mov|zip|exe|dll|pem|key|pyc)$/i.test(f)||/(^|[\\/])\.env($|\.)/.test(f))failures.push(`Non-release file: ${f}`);
  if(/\.(mjs|js)$/.test(p)){
    const check=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
    if(check.status!==0)failures.push(`Syntax failed: ${f}\n${check.stderr}`);
  }
  if(/\.(md|js|mjs|py|json|yaml)$/.test(p)){
    const s=readFileSync(p,'utf8');
    // Report filenames only; never echo a suspected credential.
    if(/(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/.test(s))failures.push(`Potential credential: ${f}`);
    if(/[A-Z]:[\\/]Users[\\/](?!Public\b)[^\s'"<>]+/i.test(s))failures.push(`Personal absolute path: ${f}`);
  }
}
const manifest=readFileSync(resolve(skill,'SKILL.md'),'utf8');
if(!manifest.startsWith('---\n')||!/^name: painted-animation$/m.test(manifest)||!/^description: .+/m.test(manifest))failures.push('Invalid skill identity/frontmatter');
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`PASS: ${files.length} release files; structure, licenses, JavaScript syntax and basic hygiene checks.`);
