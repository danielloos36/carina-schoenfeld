#!/usr/bin/env node
/**
 * Baut eine passwortgeschützte Vorschau der Website nach ./docs
 *
 *   PREVIEW_PASSWORD='geheim' node scripts/build-preview.mjs
 *
 * - Jede HTML-Seite wird mit AES-256-GCM verschlüsselt (Schlüssel per PBKDF2-SHA256
 *   aus dem Passwort abgeleitet). Ohne Passwort ist der Inhalt nicht lesbar.
 * - Entschlüsselt wird im Browser über die Web Crypto API – keine Abhängigkeiten.
 * - Nach einmaliger Eingabe merkt sich der Browser den abgeleiteten Schlüssel
 *   (nicht das Passwort), damit Impressum & Co. ohne erneute Eingabe öffnen.
 * - Alle Seiten erhalten "noindex", damit die Vorschau nicht bei Google landet.
 * - Bilder, Schriften und PDFs unter docs/assets sind NICHT verschlüsselt.
 * - Das Passwort wird nirgends gespeichert.
 */
import { webcrypto as crypto } from 'node:crypto';
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs');
const PAGES = ['index.html', 'impressum/index.html', 'datenschutzerklarung/index.html', '404.html'];
const ITERATIONS = 310000;

const password = process.env.PREVIEW_PASSWORD;
if (!password) {
  console.error('Bitte Passwort setzen:  PREVIEW_PASSWORD=\'…\' node scripts/build-preview.mjs');
  process.exit(1);
}

const b64 = (buf) => Buffer.from(buf).toString('base64');
const salt = crypto.getRandomValues(new Uint8Array(16));
const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
  baseKey, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
);

const NOINDEX = '<meta name="robots" content="noindex, nofollow">';

function gate({ payload, iv, prefix }) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${NOINDEX}
<title>Vorschau – geschützt</title>
<link rel="icon" href="${prefix}assets/illustrations/favicon.svg" type="image/svg+xml">
<style>
@font-face{font-family:Fraunces;src:url(${prefix}assets/fonts/fraunces.woff2) format("woff2");font-weight:300 700;font-display:swap}
@font-face{font-family:Figtree;src:url(${prefix}assets/fonts/figtree.woff2) format("woff2");font-weight:300 800;font-display:swap}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fbf7f1;color:#26302e;font-family:Figtree,system-ui,sans-serif;padding:16px}
.box{width:100%;max-width:400px;background:#fff;border-radius:24px;padding:36px 32px;box-shadow:0 1px 2px rgba(38,48,46,.04),0 12px 40px -16px rgba(38,48,46,.2);text-align:center}
.box img{width:56px;height:56px;margin:0 auto 18px;display:block}
h1{font-family:Fraunces,Georgia,serif;font-weight:450;font-size:1.7rem;margin:0 0 6px}
p{margin:0 0 22px;color:#56625e;line-height:1.5}
input{width:100%;font:inherit;padding:13px 16px;border-radius:12px;border:1.5px solid #e7e0d5;background:#fbf7f1;color:inherit}
input:focus{outline:none;border-color:#3f6656;background:#fff}
button{margin-top:12px;width:100%;font:inherit;font-weight:600;padding:13px;border:0;border-radius:999px;background:#3f6656;color:#fff;cursor:pointer}
button:hover{background:#335446}
.err{color:#a4533a;font-size:.92rem;min-height:1.4em;margin:10px 0 0}
</style>
</head>
<body>
<form class="box" id="f">
  <img src="${prefix}assets/illustrations/favicon.svg" alt="">
  <h1>Vorschau</h1>
  <p>Diese Website ist noch nicht veröffentlicht. Bitte geben Sie das Passwort ein.</p>
  <label for="pw" style="position:absolute;left:-9999px">Passwort</label>
  <input id="pw" type="password" autocomplete="current-password" placeholder="Passwort" autofocus required>
  <button type="submit">Öffnen</button>
  <p class="err" id="err" role="alert"></p>
</form>
<script>
(function(){
  var SALT="${b64(salt)}", IV="${iv}", DATA="${payload}", IT=${ITERATIONS}, STORE="preview-key";
  var u8=function(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0)})};
  var ready=new Promise(function(r){if(document.readyState==="complete")r();else addEventListener("load",function(){r()})});
  function open(key){
    return ready.then(function(){return crypto.subtle.decrypt({name:"AES-GCM",iv:u8(IV)},key,u8(DATA))}).then(function(buf){
      var html=new TextDecoder().decode(buf);
      document.open();document.write(html);document.close();
    });
  }
  function fromStore(){
    try{var raw=localStorage.getItem(STORE);if(!raw)return Promise.reject();
      var o=JSON.parse(raw);if(o.salt!==SALT)return Promise.reject();
      return crypto.subtle.importKey("raw",u8(o.k),"AES-GCM",false,["decrypt"]);
    }catch(e){return Promise.reject()}
  }
  var box=document.getElementById("f");
  fromStore().then(function(k){box.style.visibility="hidden";return open(k)}).catch(function(){box.style.visibility=""});
  document.getElementById("f").addEventListener("submit",function(e){
    e.preventDefault();
    var err=document.getElementById("err");err.textContent="Wird geprüft …";
    var pw=new TextEncoder().encode(document.getElementById("pw").value);
    crypto.subtle.importKey("raw",pw,"PBKDF2",false,["deriveKey"]).then(function(base){
      return crypto.subtle.deriveKey({name:"PBKDF2",salt:u8(SALT),iterations:IT,hash:"SHA-256"},base,{name:"AES-GCM",length:256},true,["decrypt"]);
    }).then(function(key){
      return crypto.subtle.exportKey("raw",key).then(function(raw){
        return open(key).then(function(){
          try{localStorage.setItem(STORE,JSON.stringify({salt:SALT,k:btoa(String.fromCharCode.apply(null,new Uint8Array(raw)))}))}catch(e){}
        });
      });
    }).catch(function(){err.textContent="Das Passwort ist leider falsch.";});
  });
})();
</script>
</body>
</html>
`;
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp(join(ROOT, 'assets'), join(OUT, 'assets'), { recursive: true });
await writeFile(join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
await writeFile(join(OUT, '.nojekyll'), '');

for (const page of PAGES) {
  let html = await readFile(join(ROOT, page), 'utf8');
  // Vorschau nie indexieren
  html = html.replace(/<meta name="robots"[^>]*>/i, '').replace(/<head>/i, `<head>\n  ${NOINDEX}`);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(html));
  const depth = page.split('/').length - 1;
  const prefix = depth ? '../'.repeat(depth) : '';
  const target = join(OUT, page);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, gate({ payload: b64(enc), iv: b64(iv), prefix }));
  console.log('verschlüsselt:', relative(ROOT, target));
}
console.log('\nFertig. Vorschau liegt in ./docs');
