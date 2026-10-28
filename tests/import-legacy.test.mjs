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
