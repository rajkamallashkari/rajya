import registry from "@/shared/lib/config/settings-registry.json";
import { MS_PER_SECOND } from "@/features/conversations/model/constants";

export const CALL_HEARTBEAT_INTERVAL_MS =
  (registry.call_heartbeat_interval.default as number) * MS_PER_SECOND;
export const ICE_RESTART_MAX_ATTEMPTS = registry.ice_restart_max_attempts.default as number;
export const GROUP_VIDEO_RESOLUTION = registry.group_video_resolution.default as string;
export const GROUP_VIDEO_FRAME_RATE = registry.group_video_frame_rate.default as number;
export const STUN_URLS = registry.stun_urls.default as string[];
export const DIRECT_PARTICIPANT_MAX = 2;
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
