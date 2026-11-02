import test from 'node:test';
import assert from 'node:assert/strict';
import { between, next, totalDays, lastDay, describe, first } from '../js/schedule.js';
import { ymd, at } from '../js/dates.js';

const keys = (arr) => arr.map((o) => o.key);

test('every 14 days with a count (Invisalign: set 5 -> 22)', () => {
  const rule = { start: '2026-11-16', times: ['21:00'], repeat: 'every', every: 14, unit: 'day', endType: 'count', count: 17 };
  assert.equal(totalDays(rule), 17);
  assert.equal(ymd(lastDay(rule)), '2027-06-28');
  assert.equal(first(rule).key, '2026-11-16T21:00');
});

test('monthly on the 31st clamps to the last day', () => {
  const rule = { start: '2027-01-31', times: ['10:00'], repeat: 'monthly', monthDay: 31, endType: 'never' };
  const got = keys(between(rule, at('2027-01-01', '00:00'), at('2027-05-01', '00:00')));
  assert.deepEqual(got, ['2027-01-31T10:00', '2027-02-28T10:00', '2027-03-31T10:00', '2027-04-30T10:00']);
});

test('monthly bill starting after the due day begins next month', () => {
  const rule = { start: '2026-11-10', times: ['10:00'], repeat: 'monthly', monthDay: 5, endType: 'never' };
  assert.equal(first(rule).key, '2026-12-05T10:00');
});

test('medicine twice a day, next after a given moment', () => {
  const rule = { start: '2026-11-01', times: ['20:00', '09:00'], repeat: 'daily', endType: 'never' };
  const got = keys(next(rule, at('2026-11-02', '11:00'), 3));
  assert.deepEqual(got, ['2026-11-02T20:00', '2026-11-03T09:00', '2026-11-03T20:00']);
});

test('weekdays and weekly', () => {
  const wd = { start: '2026-11-06', times: ['08:00'], repeat: 'weekdays', endType: 'never' }; // Fri
  assert.deepEqual(keys(next(wd, at('2026-11-06', '09:00'), 2)), ['2026-11-09T08:00', '2026-11-10T08:00']);
  const wk = { start: '2026-11-02', times: ['07:00'], repeat: 'weekly', weekdays: [2, 4], endType: 'never' };
  assert.deepEqual(keys(next(wk, at('2026-11-02', '00:00'), 3)), ['2026-11-03T07:00', '2026-11-05T07:00', '2026-11-10T07:00']);
});

test('yearly on 29 Feb falls back to 28 Feb', () => {
  const rule = { start: '2028-02-29', times: ['09:00'], repeat: 'yearly', endType: 'never' };
  assert.deepEqual(keys(next(rule, at('2028-03-01', '00:00'), 1)), ['2029-02-28T09:00']);
});

test('end date and once', () => {
  const r = { start: '2026-11-03', times: ['07:00'], repeat: 'every', every: 3, unit: 'day', endType: 'date', endDate: '2026-11-12' };
  assert.equal(totalDays(r), 4);
  const once = { start: '2026-12-01', times: ['09:00'], repeat: 'once' };
  assert.equal(totalDays(once), 1);
  assert.deepEqual(next(once, at('2026-12-02', '00:00')), []);
});

test('describe', () => {
  assert.equal(describe({ start: '2026-11-03', times: ['07:00'], repeat: 'every', every: 3, unit: 'day' }), 'Every 3 days at 7:00 AM');
  assert.equal(describe({ start: '2026-11-05', times: ['10:00'], repeat: 'monthly', monthDay: 5 }), 'Every month on the 5th at 10:00 AM');
});
