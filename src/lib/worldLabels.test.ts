import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Orthographic Html multiplies distanceFactor by camera.zoom (24–65).
// Labels are screen UI: their CSS dimensions must survive camera zoom.
for (const file of ['GameWorld', 'CampaignWorld', 'ExplorationEncounters', 'WorldDetails']) {
  test(`${file}: rótulos mantêm tamanho de tela ao ampliar o mundo`, () => {
    const source = ts.createSourceFile(file + '.tsx', readFileSync(
      new URL(`../components/${file}.tsx`, import.meta.url), 'utf8',
    ), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let labels = 0;
    function visit(node: ts.Node) {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
          node.tagName.getText(source) === 'Html') {
        labels++;
        for (const prop of node.attributes.properties) {
          if (ts.isJsxAttribute(prop)) {
            assert.notEqual(prop.name.getText(source), 'distanceFactor',
              'distanceFactor amplia os rótulos centenas de vezes na câmera ortográfica');
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    assert.ok(labels > 0, 'a verificação precisa encontrar rótulos do cenário');
  });
}
