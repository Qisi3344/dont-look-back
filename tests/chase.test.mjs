import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_GAP, CATCH_DISTANCE, IMPACT, playerCruiseSpeed,
  chaserTargetSpeed, dampSpeed, advanceCyclist, LAUNCH_SPRINT_SPEED, BOOST_SPEED, BRAKE_SPEED,
} from '../src/chase.js';

/** A deterministic headless run using the exact chase, acceleration and crash data in gameplay. */
function simulate({ events = [], dt = 1 / 60, alwaysBrake = false } = {}) {
  let z = 0, v = 11, enemyZ = -INITIAL_GAP, enemySpeed = 13.5;
  let stun = 0, recovery = 0, time = 0, nextEvent = 0, collisions = 0;
  let minGap = INITIAL_GAP, maxGap = INITIAL_GAP;
  while (time < 250 && z < 1800) {
    let target = alwaysBrake ? BRAKE_SPEED : playerCruiseSpeed(z);
    if (stun > 0) {
      stun = Math.max(0, stun - dt);
      target = 1;
    }
    recovery = Math.max(0, recovery - dt);
    v = dampSpeed(v, target, stun > 0 ? 2.4 : recovery > 0 ? 1.8 : 1.10, dt);
    const lastZ = z;
    z += v * dt;
    while (nextEvent < events.length && events[nextEvent].z <= z) {
      const { z: place, type } = events[nextEvent];
      if (place >= lastZ) {
        const impact = IMPACT[type];
        v *= impact.multiplier;
        stun = Math.max(stun, impact.stun);
        recovery = Math.max(recovery, impact.recovery);
        collisions++;
      }
      nextEvent++;
    }
    const result = advanceCyclist({ enemyZ, enemySpeed, playerZ: z }, dt);
    enemyZ = result.enemyZ;
    enemySpeed = result.enemySpeed;
    minGap = Math.min(minGap, result.gap);
    maxGap = Math.max(maxGap, result.gap);
    time += dt;
    if (result.gap < CATCH_DISTANCE) return { won: false, z, time, gap: result.gap, minGap, maxGap, collisions };
  }
  return { won: z >= 1800, z, time, gap: z - enemyZ, minGap, maxGap, collisions };
}

test('the cyclist is actually faster early in the chase', () => {
  assert(chaserTargetSpeed(0, INITIAL_GAP) > playerCruiseSpeed(0));
});

test('a perfect run can reach the finish without automatic capture', () => {
  const result = simulate();
  assert.equal(result.won, true, JSON.stringify(result));
  assert(result.gap > CATCH_DISTANCE);
  assert(result.gap < INITIAL_GAP, 'a pursuer must close the opening lead');
});

test('cyclist speed reacts to lead but remains within arcade bounds', () => {
  assert(chaserTargetSpeed(800, 90) > chaserTargetSpeed(800, 12));
  assert(chaserTargetSpeed(800, 90) < 32);
  assert(chaserTargetSpeed(800, 12) > 25);
});

test('multiple small obstacles can result in capture', () => {
  const result = simulate({ events: [
    { z: 240, type: 'gravel' }, { z: 310, type: 'cone' },
    { z: 390, type: 'gravel' }, { z: 470, type: 'cone' },
    { z: 510, type: 'gravel' }, { z: 545, type: 'cone' },
  ] });
  assert.equal(result.won, false, JSON.stringify(result));
  assert(result.collisions >= 2, JSON.stringify(result));
});

test('one early trash-can collision is survivable if the player recovers', () => {
  const result = simulate({ events: [{ z: 240, type: 'bin' }] });
  assert.equal(result.won, true, JSON.stringify(result));
});

test('two major crashes can cause a loss', () => {
  const result = simulate({ events: [{ z: 240, type: 'bin' }, { z: 410, type: 'barrier' }] });
  assert.equal(result.won, false, JSON.stringify(result));
});

test('braking indefinitely is punished by a real catch-up', () => {
  const result = simulate({ alwaysBrake: true });
  assert.equal(result.won, false, JSON.stringify(result));
  assert(result.time < 18, JSON.stringify(result));
});

test('physics result is similar at 30, 60 and 120 FPS', () => {
  const runs = [1 / 30, 1 / 60, 1 / 120].map(dt => simulate({ dt }));
  for (const x of runs) assert(x.won, JSON.stringify(x));
  assert(Math.max(...runs.map(x => x.gap)) - Math.min(...runs.map(x => x.gap)) < 1.5);
});


test('arcade cruise, opening sprint and boost are all genuinely fast', () => {
  assert(playerCruiseSpeed(0) * 3.6 >= 80);
  assert(playerCruiseSpeed(600) * 3.6 >= 100);
  assert(LAUNCH_SPRINT_SPEED > playerCruiseSpeed(600));
  assert(BOOST_SPEED > LAUNCH_SPRINT_SPEED);
});

test('clean race finishes in under 80 seconds instead of slow cruising', () => {
  const result = simulate();
  assert(result.won, JSON.stringify(result));
  assert(result.time < 80, JSON.stringify(result));
});
