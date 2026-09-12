import { Camera, Pencil, Settings } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useMe, useUpdateProfile } from "@/features/auth/api/queries";
import { AccountSwitcher } from "@/features/auth/components/account-switcher";
import { checkUsername } from "@/features/auth/api/identity";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
  USERNAME_AVAILABILITY_DEBOUNCE_MS,
  USERNAME_FORMAT,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/features/auth/model/limits";
import { visibleProfileContacts } from "@/features/auth/model/self-profile";
import { presignAndUpload } from "@/features/media/model/direct-upload";
import { useLongPress } from "@/shared/hooks/use-long-press";
import { asPreferenceDocument, preferencePrivacy } from "@/features/settings/model/map-preferences";
import { usePreferences } from "@/features/settings/api/queries";
import { useShellStore } from "@/features/settings/store/shell-store";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { ListView } from "@/shared/ui/list-view";
import { Textarea } from "@/shared/ui/textarea";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function SelfProfilePane(): ReactNode {
  const { t } = useTranslation();
  const me = useMe();
  const preferences = usePreferences();
  const update = useUpdateProfile();
  const setProfileSettingsOpen = useShellStore((state) => state.setProfileSettingsOpen);
  const [editing, setEditing] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarErrorKey, setAvatarErrorKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<
    "available" | "checking" | "invalid" | "taken" | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const privacy = preferencePrivacy(asPreferenceDocument(preferences.data?.data));
  const contacts = visibleProfileContacts({
    email: me.data?.user.email,
    phone: me.data?.user.phone,
    showEmail: privacy.show_email_on_profile,
    showPhone: privacy.show_phone_on_profile,
  });
  const identityName = me.data?.account.display_name ?? "";
  const openSwitcher = () => setSwitcherOpen(true);
  const longPress = useLongPress(openSwitcher, { enabled: !editing });

  useEffect(() => {
    if (!me.data || editing) {
      return;
    }
    setDisplayName(me.data.account.display_name);
    setUsername(me.data.account.username);
    setBio(me.data.account.bio ?? "");
  }, [editing, me.data]);

  useEffect(() => {
    if (!editing || !me.data || username === me.data.account.username) {
      setUsernameStatus(null);
      return;
    }
    if (
      username.length < USERNAME_MIN_LENGTH ||
      username.length > USERNAME_MAX_LENGTH ||
      !USERNAME_FORMAT.test(username)
    ) {
      setUsernameStatus("invalid");
      return;
    }
    let current = true;
    setUsernameStatus("checking");
    const timer = window.setTimeout(() => {
      void checkUsername(username)
        .then(({ available }) => {
          if (current) {
            setUsernameStatus(available ? "available" : "taken");
          }
        })
        .catch(() => {
          if (current) {
            setUsernameStatus("invalid");
          }
        });
    }, USERNAME_AVAILABILITY_DEBOUNCE_MS);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [editing, me.data, username]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const preview = URL.createObjectURL(avatarFile);
    setAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [avatarFile]);

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      setAvatarErrorKey("auth.profile.avatar_file_invalid");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarErrorKey("auth.profile.avatar_size_invalid");
      return;
    }
    setAvatarErrorKey(null);
    setAvatarFile(file);
  };

  const onRemoveAvatar = async (): Promise<void> => {
    setAvatarErrorKey(null);
    try {
      await update.mutateAsync({
        avatar: null,
        bio: me.data!.account.bio ?? "",
        display_name: me.data!.account.display_name,
        username: me.data!.account.username,
      });
      setAvatarFile(null);
    } catch {
      setAvatarErrorKey("auth.profile.avatar_remove_failed");
    }
  };

  const onSave = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const name = displayName.trim();
    const handle = username.trim();
    if (!name) {
      setErrorKey("auth.profile.name_blank");
      return;
    }
    if (handle.length < USERNAME_MIN_LENGTH) {
      setErrorKey("auth.profile.username_short");
      return;
    }
    if (!USERNAME_FORMAT.test(handle)) {
      setErrorKey("auth.profile.username_invalid");
      return;
    }
    setErrorKey(null);
    try {
      if (handle !== me.data?.account.username) {
        const availability =
          usernameStatus === "available" ? { available: true } : await checkUsername(handle);
        if (!availability.available) {
          setErrorKey("auth.profile.username_taken");
          return;
        }
      }
      const avatar = avatarFile ? await presignAndUpload(avatarFile) : undefined;
      await update.mutateAsync({ avatar, bio, display_name: name, username: handle });
      setAvatarFile(null);
      setEditing(false);
    } catch {
      setErrorKey(
        avatarFile ? "auth.profile.avatar_upload_failed" : "auth.onboarding.profile_failed",
      );
    }
  };

  const status = me.isPending ? "loading" : me.isError ? "error" : "ready";

  return (
    <section
      aria-labelledby="destination-profile-title"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[var(--surface-panel)]"
      data-destination="profile"
      data-profile-pane=""
    >
      <header className="flex items-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-list-y)]">
        <h1 className={WEIGHT_EMPHASIS} id="destination-profile-title">
          {t("shell.profile")}
        </h1>
        <span className="flex-1" />
        <IconButton
          aria-label={t("auth.profile.edit")}
          disabled={editing}
          onClick={() => {
            setErrorKey(null);
            setEditing(true);
          }}
          type="button"
        >
          <Pencil className={ICON_CLASS} />
        </IconButton>
        <IconButton
          aria-label={t("shell.settings")}
          onClick={() => setProfileSettingsOpen(true)}
          type="button"
        >
          <Settings className={ICON_CLASS} />
        </IconButton>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-list-x)] py-[var(--space-4)]">
        <ListView onRetry={() => void me.refetch()} status={status}>
          {me.data ? (
            editing ? (
              <form
                className="flex flex-col gap-[var(--space-4)]"
                data-profile-edit=""
                onSubmit={(event) => void onSave(event)}
              >
                <div className="flex flex-col items-center gap-[var(--space-2)]">
                  <Button
                    aria-label={t("auth.profile.avatar_change")}
                    className="relative h-auto rounded-[var(--radius-full)] p-0"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    variant="ghost"
                  >
                    <Avatar
                      className="size-[var(--space-12)]"
                      name={displayName || identityName}
                      src={avatarPreview ?? me.data.account.avatar_url}
                    />
                    <Camera className="absolute right-0 bottom-0 size-[var(--space-4)] rounded-[var(--radius-full)] bg-[var(--surface-raised)] p-[var(--space-1)]" />
                  </Button>
                  <input
                    accept={AVATAR_ALLOWED_TYPES.join(",")}
                    className="hidden"
                    onChange={onAvatarChange}
                    ref={fileInputRef}
                    type="file"
                  />
                  {avatarFile ? (
                    <Button onClick={() => setAvatarFile(null)} type="button" variant="ghost">
                      {t("auth.profile.avatar_cancel")}
                    </Button>
                  ) : me.data.account.avatar_url ? (
                    <Button
                      disabled={update.isPending}
                      onClick={() => void onRemoveAvatar()}
                      type="button"
                      variant="ghost"
                    >
                      {t("auth.profile.avatar_remove")}
                    </Button>
                  ) : null}
                  {avatarErrorKey ? (
                    <p className="text-[length:var(--text-sm)] text-[var(--status-danger)]">
                      {t(avatarErrorKey)}
                    </p>
                  ) : null}
                </div>
                <label className="flex flex-col gap-[var(--space-1)]">
                  <span>{t("auth.onboarding.display_name")}</span>
                  <Input
                    autoComplete="name"
                    onChange={(event) => setDisplayName(event.target.value)}
                    value={displayName}
                  />
                </label>
                <label className="flex flex-col gap-[var(--space-1)]">
                  <span>{t("auth.onboarding.username")}</span>
                  <Input
                    autoComplete="username"
                    maxLength={USERNAME_MAX_LENGTH}
                    onChange={(event) => {
                      setErrorKey(null);
                      setUsername(event.target.value.toLowerCase());
                    }}
                    value={username}
                  />
                  {usernameStatus && errorKey !== `auth.profile.username_${usernameStatus}` ? (
                    <span
                      aria-live="polite"
                      className={
                        usernameStatus === "available"
                          ? "text-[var(--status-success)]"
                          : usernameStatus === "checking"
                            ? "text-[var(--text-secondary)]"
                            : "text-[var(--status-danger)]"
                      }
                    >
                      {t(`auth.profile.username_${usernameStatus}`)}
                    </span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-[var(--space-1)]">
                  <span>{t("auth.onboarding.bio")}</span>
                  <Textarea onChange={(event) => setBio(event.target.value)} value={bio} />
                </label>
                {errorKey ? (
                  <p className="text-[length:var(--text-sm)] text-[var(--status-danger)]">
                    {t(errorKey)}
                  </p>
                ) : null}
                <div className="mt-auto flex gap-[var(--control-gap)]">
                  <Button
                    onClick={() => {
                      setAvatarErrorKey(null);
                      setAvatarFile(null);
                      setErrorKey(null);
                      setEditing(false);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    {t("auth.profile.cancel")}
                  </Button>
                  <Button disabled={update.isPending} type="submit">
                    {t("auth.profile.save")}
                  </Button>
                </div>
              </form>
            ) : (
              <div
                className="flex flex-col items-center gap-[var(--space-3)] text-center"
                data-profile-read=""
              >
                <Button
                  aria-label={t("auth.accounts.switcher")}
                  className="h-auto rounded-[var(--radius-full)] p-0"
                  onContextMenu={(event) => {
                    event.preventDefault();
                    longPress.onContextMenu(event);
                    openSwitcher();
                  }}
                  onPointerCancel={longPress.onPointerCancel}
                  onPointerDown={longPress.onPointerDown}
                  onPointerMove={longPress.onPointerMove}
                  onPointerUp={longPress.onPointerUp}
                  type="button"
                  variant="ghost"
                >
                  <Avatar
                    className="size-[var(--space-12)]"
                    name={identityName}
                    src={me.data.account.avatar_url}
                  />
                </Button>
                <h2 className={`text-[length:var(--text-lg)] ${WEIGHT_EMPHASIS}`}>
                  {identityName}
                </h2>
                <p className="text-[var(--text-secondary)]">
                  {t("auth.profile.handle", { username: me.data.account.username })}
                </p>
                {me.data.account.bio ? <p>{me.data.account.bio}</p> : null}
                {contacts.email ? (
                  <p data-profile-email="">
                    <span className="text-[var(--text-secondary)]">{t("auth.profile.email")} </span>
                    {contacts.email}
                  </p>
                ) : null}
                {contacts.phone ? (
                  <p data-profile-phone="">
                    <span className="text-[var(--text-secondary)]">{t("auth.profile.phone")} </span>
                    {contacts.phone}
                  </p>
                ) : null}
              </div>
            )
          ) : null}
        </ListView>
      </div>
      <AccountSwitcher onOpenChange={setSwitcherOpen} open={switcherOpen} />
    </section>
  );
}
