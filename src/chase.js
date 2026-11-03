/**
 * Chase balance v0.2. Speeds are meters/second, positions are meters.
 * The bicycle actually advances in the world. No teleporting or timer capture.
 */
export const INITIAL_GAP = 46;
export const CATCH_DISTANCE = 3.2;
export const WARNING_DISTANCE = 24;
export const CRITICAL_DISTANCE = 14;

export function playerCruiseSpeed(progress) {
  return 13.5 + Math.min(3.5, Math.max(0, progress) / 400);
}

export function chaserTargetSpeed(progress, separation) {
  // Push harder from far away, ease very slightly at close quarters.
  // Player can recover with clean driving, but repeated crashes cost ground.
  const gapBias = Math.max(-0.68, Math.min(1.5, (separation - 36) * 0.033));
  return playerCruiseSpeed(progress) + 0.48 + gapBias;
}

export function dampSpeed(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function advanceCyclist({ enemyZ, enemySpeed, playerZ }, dt) {
  const target = chaserTargetSpeed(playerZ, playerZ - enemyZ);
  const speed = dampSpeed(enemySpeed, target, 1.5, dt);
  const nextZ = enemyZ + speed * dt;
  return { enemyZ: nextZ, enemySpeed: speed, gap: playerZ - nextZ };
}

export const IMPACT = Object.freeze({
  gravel: Object.freeze({ multiplier: 0.58, stun: 0, recovery: 0 }),
  cone: Object.freeze({ multiplier: 0.58, stun: 0, recovery: 0 }),
  bin: Object.freeze({ multiplier: 0.26, stun: 1.1, recovery: 4.5 }),
  barrier: Object.freeze({ multiplier: 0.24, stun: 1.9, recovery: 4.5 }),
});
