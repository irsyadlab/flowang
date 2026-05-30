import { describe, expect, test } from 'bun:test';
import fc from 'fast-check';
import * as Y from 'yjs';
import { arbitraryWallet } from '../helpers/arbitraries';
import type { Wallet } from '../../src/types';

describe('Property 4: CRDT Confluence', () => {
  test('merging two Yjs docs in any order produces identical state (100 runs)', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryWallet, { minLength: 1, maxLength: 10 }),
        fc.array(arbitraryWallet, { minLength: 1, maxLength: 10 }),
        (changesA: Wallet[], changesB: Wallet[]) => {
          // Use unique keys for each set to avoid LWW conflict ambiguity
          const setA = changesA.map((w, i) => ({ ...w, id: `a-${i}-${w.id}` }));
          const setB = changesB.map((w, i) => ({ ...w, id: `b-${i}-${w.id}` }));

          const docA = new Y.Doc();
          const docB = new Y.Doc();

          setA.forEach((w) => docA.getMap('wallets').set(w.id, w));
          setB.forEach((w) => docB.getMap('wallets').set(w.id, w));

          // Merge A→B
          const docMergeAB = new Y.Doc();
          Y.applyUpdate(docMergeAB, Y.encodeStateAsUpdate(docA));
          Y.applyUpdate(docMergeAB, Y.encodeStateAsUpdate(docB));

          // Merge B→A
          const docMergeBA = new Y.Doc();
          Y.applyUpdate(docMergeBA, Y.encodeStateAsUpdate(docB));
          Y.applyUpdate(docMergeBA, Y.encodeStateAsUpdate(docA));

          expect(Y.encodeStateAsUpdate(docMergeAB)).toEqual(
            Y.encodeStateAsUpdate(docMergeBA)
          );

          docA.destroy();
          docB.destroy();
          docMergeAB.destroy();
          docMergeBA.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
