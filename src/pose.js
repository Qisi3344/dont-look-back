/** Spatial conventions: world movement is +Z. */
export const BIKE_MODEL_FRONT_Z = -1; // bicycle was originally modeled pointing toward -Z
export const BIKE_HEADING_CORRECTION = Math.PI; // rotate geometry into world +Z
export const STREAMER_HEAD_Z = -0.89; // head lies toward the trailing camera
export const STREAMER_FEET_Z = 2.22; // feet point toward the direction of travel
export const STREAMER_RIGHT_SHOULDER_X = 0.52; // physically right for a character facing -Z
export const STREAMER_RIGHT_ELBOW_X = 1.02;
export const STREAMER_RIGHT_HAND_Z = -1.27;

// Model yaw is PI: positive local X head pitch tilts the face toward world -Z (camera and pursuer).
export const STREAMER_HEAD_PITCH=0.62;
export const STREAMER_GAZE_BACK_EXTRA=0.16;
export const STREAMER_FACE_Y=0.316;

// User-requested 180° turn in the skateboard's horizontal plane.
// Only the streamer model turns; the board, phone, movement and cyclist do not.
export const STREAMER_BOARD_YAW = Math.PI;
// After the turn, shift the elongated model back to the center of the deck.
export const STREAMER_BOARD_CENTER_OFFSET_Z = 0.65;

// Mirrored bent arm now rests on the opposite side of the head.
export const STREAMER_REST_ARM_SHOULDER_X=-0.52;
export const STREAMER_REST_ARM_ELBOW_X=-1.02;
export const STREAMER_REST_ARM_HAND_X=-0.39;
