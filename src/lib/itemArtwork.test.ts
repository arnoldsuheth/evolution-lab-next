import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ITEMS} from './game';
import {artworkForItem} from './artwork';
import {ApprovedArtwork} from '../components/ApprovedArtwork';
test('recortes dos itens ficam dentro das folhas e possuem clip independente da proporção do ícone',()=>{
 for(const item of Object.values(ITEMS)){
  const c=artworkForItem(item);if(!c)continue;
  const [w,h]=c.sheet==='items'?[1536,1024]:[1217,1293];
  assert.ok(c.x>=0&&c.y>=0&&c.w>0&&c.h>0&&c.x+c.w<=w&&c.y+c.h<=h,item.id);
 }
 const html=renderToStaticMarkup(createElement(ApprovedArtwork,{crop:{sheet:'equipment',x:190,y:195,w:93,h:218},name:'Espada',inset:6}));
 assert.ok(html.includes('<clipPath'));assert.ok(html.includes('clip-path="url(#'));assert.ok(html.includes('viewBox="0 0 100 100"'));assert.ok(html.includes('xMidYMid meet'));
});
