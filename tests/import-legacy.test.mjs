import test from 'node:test';
import assert from 'node:assert/strict';
import {legacyPreview} from '../src/import-legacy.mjs';
test('importa somente os campos de hobby e biblioteca, sem copiar sessão ou credenciais',()=>{
 const r=legacyPreview(JSON.stringify({v:1,token:'segredo',cfg:{key:'privado'},claude:{0:{done:true}},livros:[{id:'b1',titulo:'Meu livro',notas:'Uma nota',pag:45,pags:100,frases:['Página 8: uma ideia'],url:'javascript:alert(1)'}],ext:{violao:{m:{1:500},a:{'0:0':true}},arte:{a:{'0:0':true,'999:0':true}}},violao:{treinos:{'2026-10-20':20,'2026-02-30':40},acordes:{C:2,ZZ:2},musicas:[{nome:'Minha música',st:'a',tr:3}]}}));
 assert.equal(r.counts.books,1);assert.equal(r.counts.external,2);assert.equal(r.counts.songs,1);
 const b=r.entries.find(e=>e.collection==='books').value;assert.equal(b.notas,'Uma nota');assert.equal(b.url,'');assert.equal(b.pag,45);
 assert.equal(r.entries.find(e=>e.id==='violao').value.m[1],12);
 assert.deepEqual(r.entries.find(e=>e.id==='arte').value.a,{'0:0':true});
 assert.equal(r.entries.filter(e=>e.id==='d2026-02-30').length,0);
 assert.equal(JSON.stringify(r).includes('segredo'),false);assert.equal(JSON.stringify(r).includes('privado'),false);
});
test('rejeita formato inesperado ou arquivo grande sem transformar falha em catálogo vazio',()=>{assert.throws(()=>legacyPreview('{bad'),/JSON válido/);assert.throws(()=>legacyPreview('{"v":1,"session":"x"}'),/Não reconheci/);assert.throws(()=>legacyPreview('x'.repeat(2000001)),/2 MB/);});
test('não deixa identificadores duplicados ou campos arbitrários entrarem no plano de importação',()=>{const r=legacyPreview(JSON.stringify({v:1,livros:[{id:'b1',titulo:'Primeiro',token:'chave'},{id:'b1',titulo:'Duplicado'},{id:'<script>',titulo:'Outro',url:'https://user:password@example.com'}]}));assert.equal(r.entries.length,2);assert.equal(r.entries[1].id,'import-2');assert.equal(r.entries[1].value.url,'');assert.equal('token' in r.entries[0].value,false);assert.equal(r.warnings.length,1);});

test('identificadores reservados não alteram o protótipo da estante',()=>{const r=legacyPreview(JSON.stringify({v:1,livros:[{id:'__proto__',titulo:'Seguro'}]}));assert.equal(r.entries[0].id,'import-0');});

test('oportunidades importam etapa e próxima ação sem campos privados extras',()=>{const r=legacyPreview(JSON.stringify({v:1,prospectos:[{id:'p1',nome:'Cliente fictício',etapa:'apresentado',ideia:'Site exemplo',acao:'Conferir proposta',url:'javascript:alert(1)',arquivado:true,token:'privado'}]}));assert.equal(r.counts.prospects,1);assert.equal(r.entries[0].value.acao,'Conferir proposta');assert.equal(r.entries[0].value.arquivado,true);assert.equal(r.entries[0].value.url,'');assert.equal(JSON.stringify(r).includes('privado'),false);});
test('importa provas e tópicos reais da faculdade, preservando prazo e conclusão sem inventar notas',()=>{const r=legacyPreview(JSON.stringify({v:1,fac:{min:6,discs:[{id:'alg',nome:'Algoritmos',nota:10,topicos:[{t:'Funções',ok:true}],entregas:[{t:'Prova real',data:'2026-11-05',ok:false},{t:'Outro trabalho',data:'2026-02-30',ok:false}]}]}}));assert.equal(r.counts.tasks,3);const prova=r.entries.find(e=>e.value.title==='Prova real');assert.equal(prova.value.due,'2026-11-05');assert.equal(prova.value.subject,'Algoritmos');assert.equal(prova.value.done,false);assert.equal(r.entries.find(e=>e.value.title==='Funções').value.done,true);assert.equal(r.entries.find(e=>e.value.title==='Outro trabalho').value.due,'');assert.deepEqual(r.entries.find(e=>e.collection==='subjects').value.notas,{});});

test('disciplinas sem atividades continuam presentes, notas são filtradas e conclusões antigas não viram novas entregas',()=>{const r=legacyPreview(JSON.stringify({v:1,fac:{discs:[{id:'d1',nome:'Redes',notas:{av1:8.5,av2:99,token:'privado'},sem:1}]},claude:{a1:{done:true,total:5,best:4,token:'privado'}}}));assert.equal(r.counts.subjects,1);assert.equal(r.counts.tasks,0);assert.deepEqual(r.entries.find(e=>e.collection==='subjects').value.notas,{av1:8.5});assert.equal(r.counts.legacy,1);assert.equal(r.entries.some(e=>e.collection==='claude'),false);assert.equal(JSON.stringify(r).includes('privado'),false);});
