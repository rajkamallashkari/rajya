require "rails_helper"

RSpec.describe Reports::Create do
  include ActiveSupport::Testing::TimeHelpers

  def file!(reporter, type, id, reason: "spam", details: nil)
    described_class.call(
      reporter: reporter, subject_type: type, subject_id: id, reason: reason, details: details
    )
  end

  it "creates a pending report against an account" do
    reporter = create(:user).account
    target = create(:account)
    result = file!(reporter, "account", target.id, details: " ads ")

    expect(result).to be_success
    expect(result.value).to have_attributes(
      subject_type: "account", subject_id: target.id, reason: "spam", details: "ads", status: "pending"
    )
  end

  it "creates reports against a visible message, conversation, and bot" do
    reporter = create(:user)
    peer = create(:user)
    conversation = create_talk(kind: "group", owner: reporter.account, members: [ peer.account ])
    message = create(:message, conversation: conversation, sender_account: peer.account)
    bot = create(:bot)

    expect(file!(reporter.account, "message", message.id)).to be_success
    expect(file!(reporter.account, "conversation", conversation.id)).to be_success
    expect(file!(reporter.account, "bot", bot.id)).to be_success
  end

  it "refuses a second open report on the same subject by the same reporter" do
    reporter = create(:user).account
    target = create(:account)
    expect(file!(reporter, "account", target.id)).to be_success
    expect(file!(reporter, "account", target.id).error_code).to eq(:conflict)
  end

  it "accepts a new report after the previous one is resolved (NR-39)" do
    reporter = create(:user).account
    target = create(:account)
    stub_setting(:report_cooldown, 0, category: "moderation")
    first = file!(reporter, "account", target.id).value
    first.update!(status: "dismissed")

    expect(file!(reporter, "account", target.id)).to be_success
  end

  it "rate-limits a refile inside the cooldown window" do
    reporter = create(:user).account
    target = create(:account)
    first = file!(reporter, "account", target.id).value
    first.update!(status: "dismissed")

    expect(file!(reporter, "account", target.id).error_code).to eq(:rate_limited)
    travel Settings.fetch(:report_cooldown).seconds + 1
    expect(file!(reporter, "account", target.id)).to be_success
  end

  it "rejects an unknown reason, own account, and overlong details" do
    reporter = create(:user).account
    target = create(:account)
    overlong = "x" * (Settings.fetch(:max_message_length) + 1)

    expect(file!(reporter, "account", target.id, reason: "nope").error_code).to eq(:validation_failed)
    expect(file!(reporter, "account", reporter.id).error_code).to eq(:validation_failed)
    expect(file!(reporter, "account", target.id, details: overlong).error_code).to eq(:validation_failed)
  end

  it "rejects a report of the reporter's own message" do
    reporter = create(:user)
    peer = create(:account)
    conversation = create_direct_between(reporter.account, peer)
    message = create(:message, conversation: conversation, sender_account: reporter.account)

    expect(file!(reporter.account, "message", message.id).error_code).to eq(:validation_failed)
  end

  it "hides missing subjects as not_found" do
    reporter = create(:user).account

    expect(file!(reporter, "account", 0).error_code).to eq(:not_found)
    expect(file!(reporter, "file", 1).error_code).to eq(:not_found)
    expect(file!(reporter, "bot", 99_999).error_code).to eq(:not_found)
    expect(file!(reporter, "account", 99_999).error_code).to eq(:not_found)
  end

  it "hides conversations and messages the reporter cannot see" do
    reporter = create(:user).account
    outsider = create(:user)
    conversation = create_talk(kind: "group", owner: create(:user).account, members: [ create(:account) ])
    message = create(:message, conversation: conversation)

    expect(file!(reporter, "conversation", 99_999).error_code).to eq(:not_found)
    expect(file!(reporter, "conversation", conversation.id).error_code).to eq(:not_found)
    expect(file!(outsider.account, "message", message.id).error_code).to eq(:not_found)
    expect(file!(reporter, "message", 99_999).error_code).to eq(:not_found)
  end

  it "treats a unique-index race as conflict" do
    reporter = create(:user).account
    target = create(:account)
    allow(Report).to receive(:create!).and_raise(ActiveRecord::RecordNotUnique.new("idx"))

    expect(file!(reporter, "account", target.id).error_code).to eq(:conflict)
  end

  it "emails admins when the auto-flag threshold is reached" do
    create(:user, :admin, email: "mod@example.com")
    reporter = create(:user).account
    stub_setting(:auto_flag_threshold, 1, category: "moderation")

    expect { file!(reporter, "account", create(:account).id) }
      .to change { ActionMailer::Base.deliveries.size }.by(1)
    expect(ActionMailer::Base.deliveries.last.subject).to include("Flagged")
  end

  it "skips mail when an admin has no email and still broadcasts" do
    admin = create(:user, :admin, email: nil)
    reporter = create(:user).account
    allow(ActionCable.server).to receive(:broadcast)

    expect { file!(reporter, "account", create(:account).id) }
      .not_to change { ActionMailer::Base.deliveries.size }
    expect(ActionCable.server).to have_received(:broadcast).with(
      Realtime.account_stream(admin.account.id),
      hash_including("type" => "report_created", "auto_flagged" => false)
    )
  end
end
