require "rails_helper"

RSpec.describe Notifications::Resolve do
  include ActiveSupport::Testing::TimeHelpers
  def setup(kind: "direct")
    recipient = create(:user)
    sender = create(:user)
    conversation = if kind == "direct"
                     create_direct_between(recipient.account, sender.account)
    else
                     create_talk(kind: kind, owner: sender.account, members: [ recipient.account ])
    end
    message = create(:message, conversation: conversation, sender_account: sender.account, body: "Hi")
    [ recipient, sender, conversation, message ]
  end

  def store(account, notifications, timezone: nil)
    data = { "notifications" => notifications }
    data["locale"] = { "timezone" => timezone } if timezone
    pref = account.preference || account.build_preference
    pref.update!(data: data)
    account.reload
  end

  def resolve(account, conversation, message)
    described_class.call(account: account, conversation: conversation, message: message)
  end

  it "requires message so mentions-only cannot evaluate an empty body (F-9)" do
    recipient, _sender, conversation, _message = setup
    expect(described_class.instance_method(:call).parameters).to include([ :keyreq, :message ])
    expect { described_class.call(account: recipient.account, conversation: conversation) }.to raise_error(ArgumentError)
    expect { described_class.call(account: recipient.account, conversation: conversation, message: nil) }
      .to raise_error(ArgumentError)
  end

  it "pushes a mention in a mentions-only group and skips one without (F-9)" do
    recipient, sender, conversation, _message = setup(kind: "group")
    store(recipient.account, { "kind:group" => { "level" => "mentions" } })
    tagged = create(:message, conversation: conversation, sender_account: sender.account,
                              body: "hey <@#{recipient.account.id}>")
    plain = create(:message, conversation: conversation, sender_account: sender.account, body: "hello")
    expect(resolve(recipient.account, conversation, tagged).value).to have_attributes(notify: true, reason: :mentions)
    expect(resolve(recipient.account, conversation, plain).value).to have_attributes(notify: false, reason: :mentions)
  end

  it "evaluates DND in Asia/Kolkata while the server is UTC (F-21)" do
    recipient, _sender, conversation, message = setup
    store(recipient.account, { "global" => { "dnd_enabled" => true } }, timezone: "Asia/Kolkata")
    Time.use_zone("UTC") do
      travel_to Time.utc(2026, 1, 12, 17, 0, 0) do
        expect(resolve(recipient.account, conversation, message).value.notify).to be(false)
      end
      travel_to Time.utc(2026, 1, 12, 12, 0, 0) do
        expect(resolve(recipient.account, conversation, message).value.notify).to be(true)
      end
    end
  end

  it "does not push channel posts (BR-105)" do
    recipient, _sender, conversation, message = setup(kind: "channel")
    expect(resolve(recipient.account, conversation, message).value).to have_attributes(notify: false, reason: :channel)
  end

  it "suppresses a muted conversation once in the resolver (BR-101)" do
    recipient, _sender, conversation, message = setup
    conversation.conversation_memberships.find_by!(account: recipient.account)
                .update!(muted_until: 1.hour.from_now)
    expect(resolve(recipient.account, conversation, message).value.reason).to eq(:muted)
  end

  it "notifies again after muted_until has passed" do
    recipient, _sender, conversation, message = setup
    conversation.conversation_memberships.find_by!(account: recipient.account)
                .update!(muted_until: 1.hour.ago)
    expect(resolve(recipient.account, conversation, message).value.notify).to be(true)
  end

  it "treats a missing membership as unmuted" do
    recipient, _sender, conversation, message = setup
    conversation.conversation_memberships.find_by!(account: recipient.account).destroy!
    expect(resolve(recipient.account.reload, conversation, message).value.notify).to be(true)
  end

  it "honours level none and an unknown stored key (BR-99)" do
    recipient, _sender, conversation, message = setup
    store(recipient.account, { "global" => { "level" => "none" } })
    expect(resolve(recipient.account, conversation, message).value.reason).to eq(:none)
    other = create(:user)
    store(other.account, { "global" => { "level" => "all", "foo" => 1 } })
    expect(resolve(other.account, conversation, message).error_code).to eq(:validation_failed)
  end

  it "notifies every DM at mentions level and @everyone in a group" do
    recipient, sender, conversation, message = setup
    store(recipient.account, { "global" => { "level" => "mentions" } })
    expect(resolve(recipient.account, conversation, message).value.notify).to be(true)

    group = create_talk(kind: "group", owner: sender.account, members: [ recipient.account ])
    store(recipient.account, { "kind:group" => { "level" => "mentions" } })
    ping = create(:message, conversation: group, sender_account: sender.account, body: "@everyone")
    expect(resolve(recipient.account, group, ping).value.notify).to be(true)
  end

  it "treats @admins as a mention only for admins and owners" do
    recipient, sender, conversation, _message = setup(kind: "group")
    store(recipient.account, { "kind:group" => { "level" => "mentions" } })
    ping = create(:message, conversation: conversation, sender_account: sender.account, body: "<@admins>")
    expect(resolve(recipient.account, conversation, ping).value.notify).to be(false)
    conversation.conversation_memberships.find_by!(account: recipient.account).update!(role: "admin")
    expect(resolve(recipient.account, conversation, ping).value.notify).to be(true)
  end

  it "does not treat @admins as a mention without a membership" do
    recipient, sender, conversation, _message = setup(kind: "group")
    store(recipient.account, { "kind:group" => { "level" => "mentions" } })
    ping = create(:message, conversation: conversation, sender_account: sender.account, body: "<@admins>")
    conversation.conversation_memberships.find_by!(account: recipient.account).destroy!
    expect(resolve(recipient.account.reload, conversation, ping).value.notify).to be(false)
  end

  it "uses registry defaults when preference data is missing or not a hash" do
    recipient, _sender, conversation, message = setup
    expect(resolve(recipient.account, conversation, message).value.notify).to be(true)
    create(:preference, account: recipient.account, data: {})
    recipient.account.preference.update_columns(data: "x")
    expect(resolve(recipient.account.reload, conversation, message).value.notify).to be(true)
  end

  it "falls back to UTC when no timezone is stored" do
    recipient, _sender, conversation, message = setup
    store(recipient.account, { "global" => { "dnd_enabled" => true } })
    travel_to Time.utc(2026, 1, 12, 23, 0, 0) do
      expect(resolve(recipient.account, conversation, message).value.reason).to eq(:dnd)
    end
  end

  it "lets a conversation override silence one chat (BR-98)" do
    recipient, _sender, conversation, message = setup
    store(
      recipient.account,
      { "global" => { "level" => "all" }, "conversation:#{conversation.id}" => { "level" => "none" } }
    )
    expect(resolve(recipient.account, conversation, message).value.reason).to eq(:none)
  end
end
