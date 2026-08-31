import registry from "@/shared/lib/config/settings-registry.json";
import { MS_PER_SECOND } from "@/features/conversations/model/constants";

export const CALL_HEARTBEAT_INTERVAL_MS =
  (registry.call_heartbeat_interval.default as number) * MS_PER_SECOND;
export const ICE_RESTART_MAX_ATTEMPTS = registry.ice_restart_max_attempts.default as number;
export const GROUP_VIDEO_RESOLUTION = registry.group_video_resolution.default as string;
export const GROUP_VIDEO_FRAME_RATE = registry.group_video_frame_rate.default as number;
export const STUN_URLS = registry.stun_urls.default as string[];
export const DIRECT_PARTICIPANT_MAX = 2;
export const RING_TIMEOUT_MS = (registry.ring_timeout.default as number) * MS_PER_SECOND;
export const CALL_PIP_WIDTH_PX = 120;
export const CALL_PIP_HEIGHT_PX = 160;
export const CALL_FLOAT_WIDTH_PX = 148;
export const CALL_FLOAT_HEIGHT_PX = 196;
export const CALL_CORNER_MARGIN_PX = 12;
export const CALL_DRAG_THRESHOLD_PX = 4;
export const CALL_PIP_MOVE_THRESHOLD_PX = 6;
export const CALL_SWIPE_UP_THRESHOLD_PX = 48;
export const CALL_SWIPE_TAP_SLOP_PX = 12;
export const CALL_CONTROLS_ARM_MS = 350;
export const CALL_SNAP_MS = 180;
export const CALL_ELAPSED_TICK_MS = MS_PER_SECOND;
export const CALL_RINGTONE_INTERVAL_MS = 2000;
export const CALL_RINGTONE_FREQ_A = 440;
export const CALL_RINGTONE_FREQ_B = 480;
export const CALL_RINGTONE_GAIN = 0.15;
export const CALL_RINGTONE_GAIN_FLOOR = 0.0001;
export const CALL_RINGTONE_ATTACK_S = 0.05;
export const CALL_RINGTONE_DECAY_S = 0.9;
export const CALL_RINGTONE_STOP_S = 1;
export const CALL_RINGTONE_STAGGER_S = 0.02;
export const SPEAKER_POLL_MS = 400;
export const SPEAKER_FFT_SIZE = 256;
export const SPEAKER_FFT_BINS = 128;
export const SPEAKER_LEVEL_THRESHOLD = 20;
export const SPEAKER_EARPIECE_VOLUME = 0.65;
export const VOLUME_PROBE_ALT = 0.4;
export const VOLUME_PROBE_DEFAULT = 0.5;
export const VOLUME_PROBE_EPSILON = 0.01;

export function groupVideoConstraints(): MediaTrackConstraints {
  const [widthText, heightText] = GROUP_VIDEO_RESOLUTION.split("x");
  const width = Number(widthText);
  const height = Number(heightText);
  return {
    width: { ideal: width, max: width },
    height: { ideal: height, max: height },
    frameRate: { ideal: GROUP_VIDEO_FRAME_RATE, max: GROUP_VIDEO_FRAME_RATE },
  };
}

export const GROUP_VIDEO_CONSTRAINTS = groupVideoConstraints();
