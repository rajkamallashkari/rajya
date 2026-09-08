import { shouldStartMsw } from "@/shared/lib/api/msw/flag";

export function needsSignIn(
  activeAccountId: number | null,
  mswFlag: string | undefined = import.meta.env.VITE_MSW,
): boolean {
  return activeAccountId === null && !shouldStartMsw(mswFlag);
}
