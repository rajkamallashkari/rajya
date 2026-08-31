# Do Not Disturb is evaluated in the account's IANA timezone, including
# overnight windows and dnd_days across midnight (F-21 / BR-100).
module Notifications
  class Dnd
    MINUTES_PER_HOUR = 60

    def self.active?(settings:, timezone:, at: Time.current)
      new(settings, timezone, at).active?
    end

    def initialize(settings, timezone, at)
      @settings = settings.to_h.stringify_keys
      @timezone = timezone
      @at = at
    end

    def active?
      return false unless enabled?

      start_minutes = parse_hhmm(@settings["dnd_start"])
      end_minutes = parse_hhmm(@settings["dnd_end"])
      return false if start_minutes.nil? || end_minutes.nil?

      now = zoned_now
      now_minutes = minutes_since_midnight(now)
      days = Array(@settings["dnd_days"]).map(&:to_i)

      if start_minutes < end_minutes
        days.include?(now.wday) && now_minutes >= start_minutes && now_minutes < end_minutes
      elsif now_minutes >= start_minutes
        days.include?(now.wday)
      elsif now_minutes < end_minutes
        days.include?(now.yesterday.wday)
      else
        false
      end
    end

    private

    def enabled?
      ActiveModel::Type::Boolean.new.cast(@settings["dnd_enabled"])
    end

    def zoned_now
      zone = Time.find_zone(@timezone.to_s.presence) || Time.find_zone("UTC")
      @at.in_time_zone(zone)
    end

    def minutes_since_midnight(time)
      (time.hour * MINUTES_PER_HOUR) + time.min
    end

    def parse_hhmm(value)
      hour, minute = value.to_s.split(":")
      return if hour.blank? || minute.blank?

      h = Integer(hour, 10)
      m = Integer(minute, 10)
      (h * MINUTES_PER_HOUR) + m
    rescue ArgumentError, TypeError
      nil
    end
  end
end
