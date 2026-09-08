import { shouldStartMsw } from "@/shared/lib/api/msw/flag";

export const SIGN_IN_QUERY = "sign_in";

export function needsSignIn(
  activeAccountId: number | null,
  mswFlag: string | undefined = import.meta.env.VITE_MSW,
  forceGate = false,
): boolean {
  if (activeAccountId !== null) {
    return false;
  }
  return forceGate || !shouldStartMsw(mswFlag);
}
