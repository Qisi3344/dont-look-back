import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKE_MODEL_FRONT_Z, BIKE_HEADING_CORRECTION,
  STREAMER_HEAD_Z, STREAMER_FEET_Z,
  STREAMER_RIGHT_SHOULDER_X, STREAMER_RIGHT_ELBOW_X, STREAMER_RIGHT_HAND_Z,
  STREAMER_HEAD_PITCH, STREAMER_FACE_Y, STREAMER_GAZE_BACK_EXTRA, STREAMER_BOARD_YAW, STREAMER_BOARD_CENTER_OFFSET_Z, STREAMER_REST_ARM_SHOULDER_X, STREAMER_REST_ARM_ELBOW_X, STREAMER_REST_ARM_HAND_X } from '../src/pose.js';

test('the bicycle front points down the +Z escape route after heading correction', () => {
  const forwardAfterRotation = BIKE_MODEL_FRONT_Z * Math.cos(BIKE_HEADING_CORRECTION);
  assert(Math.abs(forwardAfterRotation - 1) < 1e-10);
});
test('streamer is face toward trailing camera while feet point forward', () => {
  assert(STREAMER_HEAD_Z < 0);
  assert(STREAMER_FEET_Z > 0);
});
test('resting hand is behind the head and mirrored horizontally', () => {
  assert(STREAMER_REST_ARM_SHOULDER_X < 0);
  assert(STREAMER_REST_ARM_ELBOW_X < STREAMER_REST_ARM_SHOULDER_X);
  assert(STREAMER_REST_ARM_HAND_X < 0);
});

test('face points skyward and tilts toward trailing camera', () => {
  assert(Math.cos(STREAMER_HEAD_PITCH)>0.75);
  assert(Math.sin(STREAMER_HEAD_PITCH)*Math.cos(STREAMER_BOARD_YAW)<0);
  assert(STREAMER_FACE_Y>0.3);
});
test('watching the chaser tilts face farther backward', () => {
  assert(STREAMER_GAZE_BACK_EXTRA>0);
  assert(STREAMER_HEAD_PITCH+STREAMER_GAZE_BACK_EXTRA>STREAMER_HEAD_PITCH);
});

test('streamer is turned by 180 degrees only about the upright board axis', () => {
  assert(Math.abs(STREAMER_BOARD_YAW - Math.PI) < 1e-12);
  // Y-axis turn swaps head/feet positions, but keeps the face skyward (+Y).
  const headWorldZ = -STREAMER_HEAD_Z + STREAMER_BOARD_CENTER_OFFSET_Z;
  const feetWorldZ = -STREAMER_FEET_Z + STREAMER_BOARD_CENTER_OFFSET_Z;
  assert(headWorldZ > feetWorldZ);
  assert(Math.abs(Math.cos(STREAMER_BOARD_YAW) + 1) < 1e-12);
});

test('streamer stays approximately centered on the longboard after turn', () => {
  const headWorldZ = -STREAMER_HEAD_Z + STREAMER_BOARD_CENTER_OFFSET_Z;
  const feetWorldZ = -STREAMER_FEET_Z + STREAMER_BOARD_CENTER_OFFSET_Z;
  assert(Math.abs((headWorldZ + feetWorldZ) / 2) < 0.12);
});

test('head lift is visibly larger after model yaw', () => {
  assert(STREAMER_HEAD_PITCH>0.45);
  assert(STREAMER_GAZE_BACK_EXTRA>=0.16);
});
