# Documented RRULE subset for NR-26: FREQ, INTERVAL, BYDAY, COUNT, UNTIL.
# Not a general RFC 5545 engine.
module Recurrence
  class Rrule
    FREQS = %w[DAILY WEEKLY MONTHLY YEARLY].freeze
    WEEKDAYS = { "SU" => 0, "MO" => 1, "TU" => 2, "WE" => 3, "TH" => 4, "FR" => 5, "SA" => 6 }.freeze
    LOOKAHEAD = 400

    Parsed = Struct.new(:freq, :interval, :byday, :count, :until_at, keyword_init: true)

    def self.parse(rule)
      new.parse(rule)
    end

    def self.next_after(parsed, after:, zone:, dtstart:)
      new.next_after(parsed, after: after, zone: zone, dtstart: dtstart)
    end

    def self.complete?(parsed, occurrences_sent:, next_at:)
      return true if parsed.count && occurrences_sent >= parsed.count
      return true if next_at.nil?
      return true if parsed.until_at && next_at > parsed.until_at

      false
    end

    def parse(rule)
      return if rule.blank?

      parts = parts_for(rule.to_s)
      return :invalid if parts == :invalid

      freq = parts["FREQ"]&.upcase
      return :invalid unless FREQS.include?(freq)

      interval = parse_interval(parts["INTERVAL"])
      byday = parse_byday(parts["BYDAY"])
      count = parse_count(parts["COUNT"])
      until_at = parse_until(parts["UNTIL"])
      return :invalid if [ interval, byday, count, until_at ].any? { |value| value == :invalid }
      return :invalid if count && until_at

      Parsed.new(freq: freq, interval: interval || 1, byday: byday || [], count: count, until_at: until_at)
    end

    def next_after(parsed, after:, zone:, dtstart:)
      origin = dtstart.in_time_zone(zone)
      cursor = after.in_time_zone(zone)
      (0...LOOKAHEAD).each do |index|
        stamp = occurrence_at(parsed, origin, index)
        return stamp.utc if stamp > cursor
      end
      nil
    end

    private

    def parts_for(rule)
      text = rule.strip.delete_prefix("RRULE:")
      parts = {}
      text.split(";").each do |piece|
        key, value = piece.split("=", 2)
        return :invalid if key.blank? || value.blank? || parts.key?(key.upcase)

        parts[key.upcase] = value
      end
      parts
    end

    def parse_interval(value)
      return if value.blank?

      integer = Integer(value, 10)
      max = Settings.fetch(:rrule_interval_max)
      integer.between?(1, max) ? integer : :invalid
    rescue ArgumentError
      :invalid
    end

    def parse_count(value)
      return if value.blank?

      integer = Integer(value, 10)
      max = Settings.fetch(:rrule_count_max)
      integer.between?(1, max) ? integer : :invalid
    rescue ArgumentError
      :invalid
    end

    def parse_byday(value)
      return if value.blank?

      days = value.split(",").map { |token| WEEKDAYS[token.upcase] }
      return :invalid if days.any?(&:nil?) || days.empty?

      days.uniq
    end

    def parse_until(value)
      return if value.blank?

      Time.iso8601(value)
    rescue ArgumentError
      compact = value.to_s
      return :invalid unless compact.match?(/\A\d{8}T\d{6}Z\z/)

      digits = compact.delete("TZ")
      Time.utc(
        digits[0, 4].to_i,
        digits[4, 2].to_i,
        digits[6, 2].to_i,
        digits[8, 2].to_i,
        digits[10, 2].to_i,
        digits[12, 2].to_i
      )
    end

    def occurrence_at(parsed, origin, index)
      step = index * parsed.interval
      stamp = case parsed.freq
      when "DAILY" then origin + step.days
      when "WEEKLY" then weekly_at(parsed, origin, index)
      when "MONTHLY" then origin + step.months
      else origin + step.years
      end
      stamp
    end

    def weekly_at(parsed, origin, index)
      return origin + (index * parsed.interval).weeks if parsed.byday.empty?

      days = parsed.byday.sort
      week = index / days.length
      day = days[index % days.length]
      start = origin.beginning_of_week(:sunday) + (week * parsed.interval).weeks
      start + day.days + origin.seconds_since_midnight.seconds
    end
  end
end
