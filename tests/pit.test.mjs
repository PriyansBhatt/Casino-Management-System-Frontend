import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { quantity, chipCount, money, RESULT_LABELS, zeroLeaveAllowed, requestGuard, loadOverview, createMutationStore, frozen, confirmedThenRefresh, overviewCsv, isPitRoute } from '../src/utils/pit.js';
const date = '2026-09-02';
const row = {
  physicalTableId: 'p',
  operationId: 'o',
  tableCode: 'BAC',
  tableName: 'Table',
  businessDate: date,
  status: 'OPEN',
  currentPlayers: 1,
  openingFloat: 1000,
  chipIn: 500,
  verifiedWins: 0,
  verifiedLosses: 500,
  netPosition: 500
};
const status = {
  businessDate: date,
  businessDateOpen: true,
  systemLocked: false,
  businessDateHealth: 'HEALTHY',
  continuationOverrideActive: false
};
const api = () => ({
  getCurrentOpenBusinessDate: async () => ({
    businessDate: date,
    status: 'OPEN'
  }),
  getAuthoritativeTables: async () => [row],
  getOperationalStatus: async () => status
});
const input = {
  kind: 'result',
  idempotent: true,
  tableId: 'o',
  sessionId: 's',
  date,
  payload: {
    denominations: {
      500: 2
    }
  }
};
const deferred = () => {
  let resolve;
  const promise = new Promise(r => resolve = r);
  return {
    resolve,
    promise
  };
};
test('quantities reject invalid edits without flooring or coercing to zero', () => {
  for (const v of [1.5, -1, '1.5', 'text', null, true, 2147483648]) assert.throws(() => quantity(v));
  assert.equal(quantity('2'), 2);
  assert.equal(quantity(''), 0);
  assert.equal(chipCount({
    500: 0,
    1000: 1
  }).total, 1000);
  assert.throws(() => chipCount({
    25: 1
  }));
});
test('missing values stay unavailable; legitimate zero remains zero', () => {
  for (const v of [null, undefined, '', NaN]) assert.equal(money(v), 'Unavailable');
  assert.equal(money(0), 'NPR 0');
});
test('result wording and intentional zero return', () => {
  assert.deepEqual(RESULT_LABELS, {
    WIN: 'Verified Wins',
    LOSS: 'Verified Losses'
  });
  assert.equal(zeroLeaveAllowed(0, false), false);
  assert.equal(zeroLeaveAllowed(0, true), true);
  assert.equal(zeroLeaveAllowed(500, false), true);
});
test('generation guards reject stale responses and invalidated contexts', async () => {
  const g = requestGuard(),
    d = deferred();
  let shown;
  const old = g.next();
  const pending = d.promise.then(v => {
    if (old()) shown = v;
  });
  const fresh = g.next();
  if (fresh()) shown = 'new';
  d.resolve('old');
  await pending;
  assert.equal(shown, 'new');
  g.invalidate();
  assert.equal(fresh(), false);
});
test('overview rejects mismatch, malformed reads and rollover', async () => {
  assert.equal((await loadOverview(api())).date, date);
  const a = api();
  a.getAuthoritativeTables = async () => [{
    ...row,
    businessDate: '2026-09-03'
  }];
  await assert.rejects(loadOverview(a));
  const b = api();
  let n = 0;
  b.getCurrentOpenBusinessDate = async () => ({
    status: 'OPEN',
    businessDate: n++ ? '2026-09-03' : date
  });
  await assert.rejects(loadOverview(b), /changed/);
  const c = api();
  c.getAuthoritativeTables = async () => null;
  await assert.rejects(loadOverview(c));
  const d = api();
  d.getCurrentOpenBusinessDate = async () => null;
  assert.equal((await loadOverview(d)).rows, null);
});
test('mutation target is frozen and synchronous duplicate submission is blocked', async () => {
  const s = createMutationStore(() => 'key'),
    d = deferred();
  const first = s.run(input, () => d.promise);
  await assert.rejects(s.run(input, async () => ({})), /progress/);
  assert.throws(() => {
    s.operation.payload.denominations[500] = 7;
  });
  d.resolve({
    id: 'r'
  });
  await first;
  assert.equal(s.operation, null);
  assert.deepEqual(frozen(input), input);
});
test('uncertain key survives dialog-independent store and retry uses exact target', async () => {
  let keys = 0;
  const s = createMutationStore(() => `k${++keys}`);
  let original;
  await assert.rejects(s.run(input, async op => {
    original = op;
    throw Error('timeout');
  }));
  assert.equal(s.uncertain, true);
  await assert.rejects(s.run({
    ...input,
    tableId: 'other'
  }, async () => ({})), /Resolve/);
  await s.run(null, async op => {
    assert.strictEqual(op, original);
    return {
      id: 'r'
    };
  }, true);
  assert.equal(keys, 1);
  assert.equal(s.uncertain, false);
});
test('non-idempotent uncertainty cannot be blindly retried', async () => {
  const s = createMutationStore();
  await assert.rejects(s.run({
    ...input,
    idempotent: false,
    kind: 'close'
  }, async () => {
    throw Error('timeout');
  }));
  await assert.rejects(s.run(null, async () => ({}), true), /blindly/);
  s.confirmRecovered();
  assert.equal(s.operation, null);
});
test('confirmed mutation remains successful when refresh fails', async () => {
  let success = false,
    warning;
  const value = await confirmedThenRefresh(async () => ({
    id: 'ok'
  }), async () => {
    throw Error('offline');
  }, () => {
    success = true;
  }, v => {
    warning = v;
  });
  assert.equal(value.id, 'ok');
  assert.equal(success, true);
  assert.match(warning, /Operation succeeded/);
  assert.match(warning, /do not resubmit/);
});
test('CSV carries actual date and protects formula prefixes', () => {
  for (const prefix of ['=', '+', '-', '@']) {
    const csv = overviewCsv([{
      ...row,
      tableName: prefix + 'SUM(1)'
    }]);
    assert.ok(csv.includes(`"'${prefix}SUM(1)"`));
    assert.ok(csv.includes(date));
  }
  assert.ok(overviewCsv([{
    ...row,
    tableName: 'a"b'
  }]).includes('a""b'));
});
test('Pit hides header placeholders and legacy routes are redirected', async () => {
  assert.equal(isPitRoute('/pit/tables/123'), true);
  assert.equal(isPitRoute('/customers'), false);
  const routes = await readFile('src/routes/AppRoutes.jsx', 'utf8');
  assert.doesNotMatch(routes, /<CloseTableSession|<TableReports|<OpenTableSession/);
  const layout = await readFile('src/components/layout/MainLayout.jsx', 'utf8');
  assert.match(layout, /!isPit &&/);
  const overview = await readFile('src/pages/pit/TableList.jsx', 'utf8');
  assert.doesNotMatch(overview, /changePlayerCount|initialTables|Math.trunc|Wins Paid|Losses Collected/);
  assert.match(overview, /expectedBusinessDate:\s*scope\.date/);
  await build({
    entryPoints: ['src/pages/pit/TableList.jsx', 'src/pages/pit/TableSessionDetails.jsx', 'src/pages/pit/DealerTableMode.jsx'],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    outdir: 'unused'
  });
});

test('an interrupted request survives a browser refresh using session storage', async () => {
  const data = new Map();
  const storage = {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const first = createMutationStore(()=>'persisted-key',storage);
  await assert.rejects(first.run(input,async()=>{throw Error('timeout')}));
  const restored = createMutationStore(()=>assert.fail('must reuse original key'),storage);
  assert.equal(restored.uncertain,true);
  await restored.run(null,async target=>{assert.equal(target.payload.idempotencyKey,'persisted-key');return {id:'ok'}},true);
  assert.equal(data.size,0);
});
