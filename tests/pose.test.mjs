import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKE_MODEL_FRONT_Z, BIKE_HEADING_CORRECTION,
  STREAMER_HEAD_Z, STREAMER_FEET_Z,
  STREAMER_RIGHT_SHOULDER_X, STREAMER_RIGHT_ELBOW_X, STREAMER_RIGHT_HAND_Z,
  STREAMER_HEAD_PITCH, STREAMER_FACE_Y, STREAMER_GAZE_BACK_EXTRA } from '../src/pose.js';

test('the bicycle front points down the +Z escape route after heading correction', () => {
  const forwardAfterRotation = BIKE_MODEL_FRONT_Z * Math.cos(BIKE_HEADING_CORRECTION);
  assert(Math.abs(forwardAfterRotation - 1) < 1e-10);
});
test('streamer is face toward trailing camera while feet point forward', () => {
  assert(STREAMER_HEAD_Z < 0);
  assert(STREAMER_FEET_Z > 0);
});
test('streamer right elbow is splayed and hand is behind the head', () => {
  assert(STREAMER_RIGHT_ELBOW_X > STREAMER_RIGHT_SHOULDER_X);
  assert(STREAMER_RIGHT_HAND_Z < STREAMER_HEAD_Z);
});

test('face points skyward and tilts toward trailing camera', () => {
  assert(Math.cos(STREAMER_HEAD_PITCH)>0.9);
  assert(Math.sin(STREAMER_HEAD_PITCH)<0);
  assert(STREAMER_FACE_Y>0.3);
});
test('watching the chaser tilts face farther backward', () => {
  assert(STREAMER_GAZE_BACK_EXTRA>0);
  assert(STREAMER_HEAD_PITCH-STREAMER_GAZE_BACK_EXTRA<STREAMER_HEAD_PITCH);
});
