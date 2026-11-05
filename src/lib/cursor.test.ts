import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {cursorCss,resolveCursor} from './cursor';
test('cursor: combate sempre mostra a espada; fora dele vale o que está sob o mouse',()=>{
 assert.equal(resolveCursor('map',false),'map');assert.equal(resolveCursor('point',false),'point');
 assert.equal(resolveCursor('point',true),'combat');assert.equal(resolveCursor('map',true),'combat');
});
test('cursor: cada desenho é um SVG 32×32 com ponto de clique e alternativa do sistema',()=>{
 for(const [kind,fallback] of [['map','grab'],['point','pointer'],['combat','crosshair']] as const){
  const css=cursorCss(kind);assert.match(css,/^url\("data:image\/svg\+xml,/);assert.ok(css.endsWith(`, ${fallback}`),kind);
  const svg=decodeURIComponent(css.slice(css.indexOf(',')+1,css.indexOf('")')));assert.match(svg,/width="32" height="32"/);assert.doesNotMatch(svg,/[<>]script/i);
 }
});
