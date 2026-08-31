require "rails_helper"

RSpec.describe Push::WebPush do
  def stub_send(result = true)
    if result == true
      allow(WebPush).to receive(:payload_send).and_return(true)
    else
      allow(WebPush).to receive(:payload_send).and_raise(result)
    end
  end

  it "returns false when VAPID is missing, the account has no user, or there are no subscriptions" do
    ENV.delete("VAPID_PUBLIC_KEY")
    user = create(:user)
    expect(described_class.deliver(account: user.account, payload: { "title" => "Hi" })).to be(false)

    with_vapid_env do
      expect(described_class.deliver(account: create(:account, :bot_kind), payload: { "title" => "Hi" })).to be(false)
      expect(described_class.deliver(account: user.account, payload: { "title" => "Hi" })).to be(false)
    end
  end

  def shared_pair
    user = create(:user)
    other = create(:user)
    row = create(:web_push_subscription, user: user, endpoint: "https://push.example/shared")
    create(:web_push_subscription, user: other, endpoint: row.endpoint)
    [ user, row ]
  end

  it "sends through the gem and prefixes a shared endpoint (BR-104)" do
    with_vapid_env do
      user, row = shared_pair
      stub_send
      expect(described_class.deliver(account: user.account, payload: { "title" => "Hello" })).to be(true)
      expect(WebPush).to have_received(:payload_send).with(
        hash_including(message: a_string_including("[@#{user.account.username}] Hello"),
                       endpoint: row.endpoint, ttl: Settings.fetch(:push_ttl))
      )
    end
  end

  it "does not prefix a unique endpoint" do
    with_vapid_env do
      user = create(:user)
      create(:web_push_subscription, user: user)
      stub_send
      described_class.deliver(account: user.account, payload: { "title" => "Hello" })
      expect(WebPush).to have_received(:payload_send).with(
        hash_including(message: a_string_including("\"title\":\"Hello\""))
      )
    end
  end

  it "does not prefix when the account username is blank" do
    with_vapid_env do
      user = create(:user)
      create(:web_push_subscription, user: user, endpoint: "https://push.example/shared")
      create(:web_push_subscription, endpoint: "https://push.example/shared")
      allow(user.account).to receive(:username).and_return("")
      stub_send
      described_class.deliver(account: user.account, payload: { "title" => "Hello" })
      expect(WebPush).to have_received(:payload_send).with(
        hash_including(message: a_string_including("\"title\":\"Hello\""))
      )
    end
  end

  it "deletes the subscription on a 410-equivalent error (BR-103)" do
    with_vapid_env do
      user = create(:user)
      row = create(:web_push_subscription, user: user)
      stub_send(push_http_error(WebPush::ExpiredSubscription))
      expect(described_class.deliver(account: user.account, payload: { "title" => "Hi" })).to be(false)
      expect(WebPushSubscription.where(id: row.id)).not_to exist
    end
  end

  it "deletes an invalid subscription without treating it as delivered" do
    with_vapid_env do
      user = create(:user)
      row = create(:web_push_subscription, user: user)
      stub_send(push_http_error(WebPush::InvalidSubscription))
      expect(described_class.deliver(account: user.account, payload: { "title" => "Hi" })).to be(false)
      expect(WebPushSubscription.where(id: row.id)).not_to exist
    end
  end

  it "returns false on a push response error without deleting the row" do
    with_vapid_env do
      user = create(:user)
      row = create(:web_push_subscription, user: user)
      stub_send(push_http_error(WebPush::ResponseError))
      expect(described_class.deliver(account: user.account, payload: { "title" => "Hi" })).to be(false)
      expect(row.reload).to be_persisted
    end
  end

  it "returns false on an unexpected error" do
    with_vapid_env do
      user = create(:user)
      create(:web_push_subscription, user: user)
      stub_send(RuntimeError.new("boom"))
      expect(described_class.deliver(account: user.account, payload: { "title" => "Hi" })).to be(false)
    end
  end
end
