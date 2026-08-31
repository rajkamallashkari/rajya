import { useEffect } from "react";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import * as engine from "@/features/calls/lib";
import { setLocalAccountId } from "@/features/calls/lib";

export function useWebRTCManager() {
  const accountId = useAccountsStore((state) => state.activeAccountId);

  useEffect(() => {
    setLocalAccountId(accountId);
  }, [accountId]);

  return {
    acceptCall: engine.acceptCall,
    applyAudioOutputToElement: engine.applyAudioOutputToElement,
    cancelCall: engine.cancelCall,
    endCall: engine.endCall,
    flipCamera: engine.flipCamera,
    rejectCall: engine.rejectCall,
    setSpeakerVolume: engine.setSpeakerVolume,
    startCall: engine.startCall,
    switchAudioInput: engine.switchAudioInput,
    switchAudioOutput: engine.switchAudioOutput,
    toggleCamera: engine.toggleCamera,
    toggleMic: engine.toggleMic,
    toggleSpeaker: engine.toggleSpeaker,
  };
}
