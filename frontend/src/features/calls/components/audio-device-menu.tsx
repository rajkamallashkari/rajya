import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { switchAudioInput, switchAudioOutput } from "@/features/calls/lib";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export function AudioDeviceMenu({
  children,
  onOpenChange,
  open,
}: {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void navigator.mediaDevices
      ?.enumerateDevices?.()
      .then((devices) => {
        setInputs(devices.filter((device) => device.kind === "audioinput"));
        setOutputs(devices.filter((device) => device.kind === "audiooutput"));
      })
      .catch(() => undefined);
  }, [open]);

  return (
    <DropdownMenu modal={false} onOpenChange={onOpenChange} open={open}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="z-[var(--z-call-overlay)] min-w-[var(--menu-min-width)] border-[var(--border-subtle)] bg-[var(--surface-call)] text-[var(--text-inverse)]"
        onCloseAutoFocus={(event) => event.preventDefault()}
        side="top"
      >
        {inputs.length > 0 ? (
          <>
            <DropdownMenuLabel>{t("calls.microphone")}</DropdownMenuLabel>
            {inputs.map((device) => (
              <DropdownMenuItem
                key={device.deviceId}
                onSelect={() => void switchAudioInput(device.deviceId)}
              >
                {device.label || t("calls.microphone")}
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
        {outputs.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("calls.speaker_device")}</DropdownMenuLabel>
            {outputs.map((device) => (
              <DropdownMenuItem
                key={device.deviceId}
                onSelect={() => void switchAudioOutput(device.deviceId)}
              >
                {device.label || t("calls.speaker")}
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
        {inputs.length === 0 && outputs.length === 0 ? (
          <div className="px-[var(--control-pad-x)] py-[var(--space-2)] text-[var(--text-tertiary)]">
            {t("calls.no_devices")}
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
