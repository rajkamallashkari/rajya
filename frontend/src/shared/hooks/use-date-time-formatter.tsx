import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_DATE_TIME_PREFERENCES,
  formatPreferenceCompact,
  formatPreferenceDate,
  formatPreferenceDateTime,
  formatPreferenceTime,
  type DateTimeFormatPreferences,
} from "@/shared/lib/date-time";

const DateTimePreferencesContext = createContext<DateTimeFormatPreferences>(
  DEFAULT_DATE_TIME_PREFERENCES,
);

export function DateTimePreferencesProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DateTimeFormatPreferences;
}) {
  return (
    <DateTimePreferencesContext.Provider value={value}>
      {children}
    </DateTimePreferencesContext.Provider>
  );
}

export function useDateTimeFormatter() {
  const { i18n } = useTranslation();
  const preferences = useContext(DateTimePreferencesContext);
  return useMemo(
    () => ({
      compact: (value: Date | string | number, now?: Date | string | number) =>
        formatPreferenceCompact(value, i18n.language, preferences, now),
      date: (value: Date | string | number) =>
        formatPreferenceDate(value, i18n.language, preferences),
      dateTime: (value: Date | string | number) =>
        formatPreferenceDateTime(value, i18n.language, preferences),
      time: (value: Date | string | number) =>
        formatPreferenceTime(value, i18n.language, preferences),
    }),
    [i18n.language, preferences],
  );
}
