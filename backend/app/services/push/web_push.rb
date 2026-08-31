# Web Push adapter (BR-103, BR-104). Deletes subscriptions on 410-equivalent
# errors; prefixes `[@username]` when one endpoint serves multiple accounts.
module Push
  class WebPush
    def self.deliver(account:, payload:)
      new(account, payload).deliver
    end

    def initialize(account, payload)
      @account = account
      @payload = payload.to_h.stringify_keys
    end

    def deliver
      return false unless Vapid.configured?
      return false if user.nil?

      subscriptions = user.web_push_subscriptions.to_a
      return false if subscriptions.empty?

      shared = shared_endpoints(subscriptions)
      subscriptions.filter_map { |row| send_one(row, shared.include?(row.endpoint)) }.any?
    end

    private

    def user
      @user ||= @account.user
    end

    def shared_endpoints(subscriptions)
      WebPushSubscription.where(endpoint: subscriptions.map(&:endpoint))
                         .group(:endpoint)
                         .having("COUNT(*) > 1")
                         .count
                         .keys
    end

    def send_one(subscription, multi_account)
      title = @payload.fetch("title", "")
      title = "[@#{@account.username}] #{title}" if multi_account && @account.username.present?
      message = @payload.merge("title" => title, "user_id" => user.id).to_json
      ::WebPush.payload_send(
        message: message,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        vapid: Vapid.details,
        ttl: Settings.fetch(:push_ttl)
      )
      true
    rescue ::WebPush::ExpiredSubscription, ::WebPush::InvalidSubscription
      subscription.destroy
      false
    rescue ::WebPush::ResponseError => error
      Rails.logger.warn("[Push::WebPush] Delivery failed for #{subscription.id}: #{error.message}")
      false
    rescue StandardError => error
      Rails.logger.error("[Push::WebPush] Unexpected error for #{subscription.id}: #{error.message}")
      false
    end
  end
end
