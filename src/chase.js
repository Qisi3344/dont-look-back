/**
 * Chase balance v0.2. All speeds are in meters/second and all positions in meters.
 * The cyclist really advances through the world; this is not a timer or teleport.
 */
export const INITIAL_GAP = 46;
export const CATCH_DISTANCE = 3.2;
export const WARNING_DISTANCE = 24;
export const CRITICAL_DISTANCE = 14;

// Intentionally arcade-fast: real ground displacement, not fake speedometer numbers.
export const LAUNCH_SPRINT_SPEED = 32;   // 115 km/h opening burst
export const LAUNCH_CYCLIST_SPEED = 9;   // delayed pursuit during cinematic takeoff
export const BOOST_SPEED = 34;            // 122 km/h, short cooldown skill
export const BRAKE_SPEED = 9.0;
export const ROAD_EDGE_SPEED = 14;


export function playerCruiseSpeed(progress) {
  return 22.8 + Math.min(5.2, Math.max(0, progress) / 75);
}

export function chaserTargetSpeed(progress, separation) {
  // Regulates relative speed by REAL longitudinal gap, not a scripted catch timer.
  // At long distance he gains ground; up close he eases slightly so one scrape
  // does not auto-fail an otherwise clean run.
  const gapBias = Math.max(-1.35, Math.min(2.15, (separation - 33) * 0.07));
  return playerCruiseSpeed(progress) + 0.25 + gapBias;
}

export function dampSpeed(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function advanceCyclist({ enemyZ, enemySpeed, playerZ }, dt) {
  const beforeGap = playerZ - enemyZ;
  const target = chaserTargetSpeed(playerZ, beforeGap);
  const speed = dampSpeed(enemySpeed, target, 1.5, dt);
  const nextZ = enemyZ + speed * dt;
  return { enemyZ: nextZ, enemySpeed: speed, gap: playerZ - nextZ };
}

export const IMPACT = Object.freeze({
  gravel: Object.freeze({ multiplier: 0.64, stun: 0, recovery: 0 }),
  cone: Object.freeze({ multiplier: 0.64, stun: 0, recovery: 0 }),
  bin: Object.freeze({ multiplier: 0.42, stun: 0.7, recovery: 2.5 }),
  barrier: Object.freeze({ multiplier: 0.34, stun: 1.3, recovery: 3.7 }),
  banana: Object.freeze({ multiplier: 0.72, stun: 0, recovery: 1.0 }),
  cup: Object.freeze({ multiplier: 0.78, stun: 0, recovery: 0.5 }),
  bag: Object.freeze({ multiplier: 0.61, stun: 0, recovery: 1.1 }),
  tripod: Object.freeze({ multiplier: 0.43, stun: 0.8, recovery: 2.4 }),
});
