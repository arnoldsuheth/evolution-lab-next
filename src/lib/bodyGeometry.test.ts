import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {bodyGeometry} from './bodyGeometry';
test('malhas orgânicas têm normais finitas e volume sem vértices inválidos',()=>{for(const shape of ['torso','capsule','box','sphere']){const g=bodyGeometry(shape);const p=g.getAttribute('position'),n=g.getAttribute('normal');assert.ok(p.count>100);assert.equal(p.count,n.count);for(let i=0;i<p.count;i++){for(const v of [p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i)])assert.ok(Number.isFinite(v));}g.computeBoundingBox();assert.ok(g.boundingBox!.max.y>g.boundingBox!.min.y);g.dispose();}});
