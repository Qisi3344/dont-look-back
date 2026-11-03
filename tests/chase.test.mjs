import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_GAP, CATCH_DISTANCE, IMPACT, playerCruiseSpeed, chaserTargetSpeed, dampSpeed, advanceCyclist } from '../src/chase.js';

// Headless fixed-step scenario testing: same formulas and collision data as gameplay.
function simulate({ events = [], dt = 1/60, alwaysBrake = false } = {}) {
  let z = 0, v = 11, enemyZ = -INITIAL_GAP, enemySpeed = 13.5;
  let stun = 0, recovery = 0, time = 0, i = 0, collisions = 0;
  while (time < 250 && z < 1800) {
    let target = alwaysBrake ? 4.7 : playerCruiseSpeed(z);
    if (stun > 0) { stun = Math.max(0, stun - dt); target = 1; }
    recovery = Math.max(0, recovery - dt);
    v = dampSpeed(v, target, stun > 0 ? 2.1 : recovery > 0 ? 1.4 : 0.65, dt);
    const previousZ = z;
    z += v * dt;
    while (i < events.length && events[i].z <= z) {
      if (events[i].z >= previousZ) {
        const impact = IMPACT[events[i].type];
        v *= impact.multiplier;
        stun = Math.max(stun, impact.stun);
        recovery = Math.max(recovery, impact.recovery);
        collisions++;
      }
      i++;
    }
    const next = advanceCyclist({ enemyZ, enemySpeed, playerZ: z }, dt);
    enemyZ = next.enemyZ; enemySpeed = next.enemySpeed;
    time += dt;
    if (next.gap < CATCH_DISTANCE) return { won: false, z, gap: next.gap, time, collisions };
  }
  return { won: z >= 1800, z, gap: z - enemyZ, time, collisions };
}

test('cyclist starts faster than normal skateboard cruising', () => {
  assert(chaserTargetSpeed(0, INITIAL_GAP) > playerCruiseSpeed(0));
});
test('perfect driving can win without automatic capture', () => {
  const r = simulate();
  assert(r.won, JSON.stringify(r));
  assert(r.gap > CATCH_DISTANCE && r.gap < INITIAL_GAP, JSON.stringify(r));
});
test('cyclist speed reacts to lead while remaining bounded', () => {
  assert(chaserTargetSpeed(800, 90) > chaserTargetSpeed(800, 12));
  assert(chaserTargetSpeed(800, 90) < 21);
  assert(chaserTargetSpeed(800, 12) > 10);
});
test('a string of minor hits lets cyclist catch the player', () => {
  const r = simulate({ events: [
    { z: 240, type: 'gravel' }, { z: 310, type: 'cone' },
    { z: 390, type: 'gravel' }, { z: 470, type: 'cone' },
  ] });
  assert(!r.won && r.collisions >= 2, JSON.stringify(r));
});
test('one trash-can hit is survivable', () => {
  const r = simulate({ events: [{ z: 240, type: 'bin' }] });
  assert(r.won, JSON.stringify(r));
});
test('two severe crashes cause capture', () => {
  const r = simulate({ events: [{ z: 240, type: 'bin' }, { z: 410, type: 'barrier' }] });
  assert(!r.won, JSON.stringify(r));
});
test('staying on the brakes is caught quickly', () => {
  const r = simulate({ alwaysBrake: true });
  assert(!r.won && r.time < 18, JSON.stringify(r));
});
test('30, 60 and 120 FPS have similar chase outcomes', () => {
  const results = [1/30, 1/60, 1/120].map(dt => simulate({ dt }));
  assert(results.every(r => r.won));
  assert(Math.max(...results.map(r => r.gap)) - Math.min(...results.map(r => r.gap)) < 1.5);
});
