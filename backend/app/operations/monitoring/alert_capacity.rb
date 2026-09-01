module Monitoring
  class AlertCapacity < ApplicationOperation
    Alert = Struct.new(:kind, :id, :percent, :message, keyword_init: true)

    def call
      alerts = bucket_alerts + disk_alerts
      alerts.each { |alert| deliver(alert) }
      success(alerts)
    end

    private

    def bucket_alerts
      threshold = Settings.fetch(:capacity_alert_threshold)
      StorageBucket.find_each.filter_map do |bucket|
        percent = percent_of(bucket.used_bytes, bucket.capacity_bytes)
        next if percent < threshold

        Alert.new(
          kind: "bucket",
          id: bucket.service_name,
          percent: percent,
          message: Catalog.t("mailers.ops.capacity.bucket", name: bucket.service_name, percent: percent)
        )
      end
    end

    def disk_alerts
      threshold = Settings.fetch(:capacity_alert_threshold)
      sample = Disk.sample
      return [] unless sample.ok
      return [] if sample.percent < threshold

      [
        Alert.new(
          kind: "disk",
          id: sample.path,
          percent: sample.percent,
          message: Catalog.t("mailers.ops.capacity.disk", path: sample.path, percent: sample.percent)
        )
      ]
    end

    def percent_of(used, total)
      # rubocop:disable Rajya/NoMagicNumbers -- percent scale
      (used * 100) / total
      # rubocop:enable Rajya/NoMagicNumbers
    end

    def deliver(alert)
      cache_key = "monitoring/capacity/#{alert.kind}/#{alert.id}"
      return if Rails.cache.read(cache_key)

      User.where(is_admin: true).where.not(email: nil).find_each do |admin|
        OpsMailer.capacity_alert(user: admin, alert: alert).deliver_now
      end
      Rails.cache.write(cache_key, true, expires_in: Settings.fetch(:capacity_alert_cooldown).seconds)
    end
  end
end
