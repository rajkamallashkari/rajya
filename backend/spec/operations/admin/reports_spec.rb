require "rails_helper"

# rubocop:disable RSpec/MultipleDescribes, RSpec/ExampleLength, RSpec/MultipleExpectations -- session 12.6 moderation operations
# rubocop:disable RSpec/AnyInstance -- raise-after-audit uses the persisted report
RSpec.describe Admin::Reports::Index do
  it "filters by status, subject type, and age" do
    admin = create(:user, :admin)
    pending = create(:report, reason: "spam")
    create(:report, :dismissed, reason: "spam")
    other = create(:report, subject_type: "bot", subject_id: create(:bot).id)

    rows = described_class.call(admin: admin, status: "pending", subject_type: "account").value.reports
    expect(rows.map { |item| item.report.id }).to eq([ pending.id ])
    expect(described_class.call(admin: admin).value.reports.map { |item| item.report.id })
      .to include(pending.id, other.id)
    expect(described_class.call(admin: create(:user)).error_code).to eq(:forbidden)
    expect(described_class.call(admin: admin, status: "nope").error_code).to eq(:validation_failed)
    expect(described_class.call(admin: admin, subject_type: "nope").error_code).to eq(:validation_failed)
    old = create(:report, created_at: 2.days.ago)
    ids = described_class.call(admin: admin, max_age_hours: 1).value.reports.map { |item| item.report.id }
    expect(ids).not_to include(old.id)
  end
end

RSpec.describe Admin::Reports::Show do
  it "includes subject context and rejects a missing report" do
    admin = create(:user, :admin)
    target = create(:account)
    report = create(:report, subject_type: "account", subject_id: target.id)

    item = described_class.call(admin: admin, report: report).value
    expect(item.subject).to have_attributes(type: "account", id: target.id, label: target.display_name)
    expect(described_class.call(admin: admin, report: nil).error_code).to eq(:not_found)
    expect(described_class.call(admin: create(:user), report: report).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::Reports::Dismiss do
  it "dismisses an open report and writes the audit row first" do
    admin = create(:user, :admin)
    report = create(:report)

    result = described_class.call(admin: admin, report: report, note: "nope", ip: "127.0.0.1")

    expect(result.value.report).to have_attributes(status: "dismissed", resolution_note: "nope")
    event = AuditEvent.find_by!(action: "moderation.dismiss")
    expect(event.admin_user_id).to eq(admin.id)
    expect(event.target_id).to eq(report.id)
  end

  it "keeps the audit row when closing raises" do
    admin = create(:user, :admin)
    report = create(:report)
    allow_any_instance_of(Report).to receive(:update!).and_raise(RuntimeError, "boom")

    expect do
      described_class.call(admin: admin, report: report)
    end.to raise_error(RuntimeError, "boom")
    expect(AuditEvent.find_by(action: "moderation.dismiss")).to be_present
  end

  it "rejects a closed report, a long note, a missing report, and a non-admin" do
    admin = create(:user, :admin)
    closed = create(:report, :actioned)
    open_report = create(:report)
    stub_setting(:max_message_length, 1)

    expect(described_class.call(admin: admin, report: closed).error_code).to eq(:conflict)
    expect(described_class.call(admin: admin, report: open_report, note: "ab").error_code).to eq(:validation_failed)
    expect(described_class.call(admin: admin, report: nil).error_code).to eq(:not_found)
    expect(described_class.call(admin: create(:user), report: open_report).error_code).to eq(:forbidden)
    reviewing = create(:report, status: "reviewing")
    expect(described_class.call(admin: admin, report: reviewing).value.report.status).to eq("dismissed")
  end
end

RSpec.describe Admin::Reports::Warn do
  it "mails the subject, broadcasts, and actions the report" do
    admin = create(:user, :admin)
    target = create(:user, email: "target@example.com")
    report = create(:report, subject_type: "account", subject_id: target.account_id)
    allow(ActionCable.server).to receive(:broadcast)

    expect { described_class.call(admin: admin, report: report) }
      .to change { ActionMailer::Base.deliveries.size }.by(1)
    expect(report.reload.status).to eq("actioned")
    expect(ActionCable.server).to have_received(:broadcast).with(
      Realtime.account_stream(target.account_id),
      hash_including("type" => "moderation_warning", "reason" => "spam")
    )
    expect(AuditEvent.find_by!(action: "moderation.warn").impersonated_account_id).to eq(target.account_id)
  end

  it "skips mail without an email and still audits when delivery raises" do
    admin = create(:user, :admin)
    target = create(:user, email: nil)
    report = create(:report, subject_type: "account", subject_id: target.account_id)
    allow(ActionCable.server).to receive(:broadcast)

    expect { described_class.call(admin: admin, report: report) }
      .not_to change { ActionMailer::Base.deliveries.size }

    mailed = create(:user, email: "hit@example.com")
    exploding = create(:report, subject_type: "account", subject_id: mailed.account_id)
    allow(ModerationMailer).to receive(:warning).and_raise(RuntimeError, "boom")
    expect { described_class.call(admin: admin, report: exploding) }.to raise_error(RuntimeError, "boom")
    expect(AuditEvent.where(action: "moderation.warn").count).to eq(2)

    bot = create(:bot)
    expect { described_class.call(admin: admin, report: create(:report, subject_type: "bot", subject_id: bot.id)) }
      .not_to change { ActionMailer::Base.deliveries.size }
  end
end

RSpec.describe Admin::Reports::RemoveContent do
  it "tombstones a reported message without the unsend window (BR-1)" do
    admin = create(:user, :admin)
    conversation = create_direct_between(create(:account), create(:account))
    message = create(:message, conversation: conversation, sender_account: conversation.accounts.first,
                     body: "bad", created_at: 1.year.ago)
    report = create(:report, subject_type: "message", subject_id: message.id)
    allow(ActionCable.server).to receive(:broadcast)

    described_class.call(admin: admin, report: report)
    expect(message.reload).to be_deleted
    expect(message.body).to be_nil
    expect(report.reload.status).to eq("actioned")
  end

  it "deactivates a reported bot and no-ops an already deleted message" do
    admin = create(:user, :admin)
    bot = create(:bot)
    described_class.call(admin: admin, report: create(:report, subject_type: "bot", subject_id: bot.id))
    expect(bot.reload).to be_deactivated
    described_class.call(admin: admin, report: create(:report, subject_type: "bot", subject_id: bot.id))
    expect(bot.reload).to be_deactivated

    conversation = create_direct_between(create(:account), create(:account))
    message = create(:message, conversation: conversation, sender_account: conversation.accounts.first)
    Messages::Unsend.call(message: message, actor: message.sender_account)
    report = create(:report, subject_type: "message", subject_id: message.id)
    expect(described_class.call(admin: admin, report: report)).to be_success
  end

  it "audits before a missing subject raises and rejects the wrong subject type" do
    admin = create(:user, :admin)
    missing_bot = create(:report, subject_type: "bot", subject_id: 9_999_999)
    expect { described_class.call(admin: admin, report: missing_bot) }.to raise_error(ActiveRecord::RecordNotFound)
    expect(AuditEvent.find_by(action: "moderation.remove_content")).to be_present

    missing_message = create(:report, subject_type: "message", subject_id: 9_999_999)
    expect { described_class.call(admin: admin, report: missing_message) }
      .to raise_error(ActiveRecord::RecordNotFound)

    conversation = create(:conversation)
    expect(
      described_class.call(admin: admin, report: create(:report, subject_type: "conversation",
                                                                subject_id: conversation.id)).error_code
    ).to eq(:validation_failed)
    expect(described_class.call(admin: create(:user), report: missing_bot).error_code).to eq(:forbidden)
    expect(described_class.call(admin: admin, report: nil).error_code).to eq(:not_found)
  end
end

RSpec.describe Admin::Reports::DeactivateAccount do
  it "deactivates a reported human and a reported bot" do
    admin = create(:user, :admin)
    target = create(:user)
    described_class.call(
      admin: admin, report: create(:report, subject_type: "account", subject_id: target.account_id)
    )
    expect(target.account.reload).to be_deactivated

    bot = create(:bot)
    described_class.call(admin: admin, report: create(:report, subject_type: "bot", subject_id: bot.id))
    expect(bot.reload).to be_deactivated
    described_class.call(admin: admin, report: create(:report, subject_type: "account", subject_id: bot.account_id))
    expect(bot.reload).to be_deactivated

    orphan = create(:account, :bot_kind)
    expect {
      described_class.call(admin: admin, report: create(:report, subject_type: "account", subject_id: orphan.id))
    }.to raise_error(ActiveRecord::RecordNotFound)

    human = create(:account)
    expect {
      described_class.call(admin: admin, report: create(:report, subject_type: "account", subject_id: human.id))
    }.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "audits before a missing subject raises and rejects a conversation" do
    admin = create(:user, :admin)
    missing = create(:report, subject_type: "account", subject_id: 9_999_999)
    expect { described_class.call(admin: admin, report: missing) }.to raise_error(ActiveRecord::RecordNotFound)
    expect(AuditEvent.find_by(action: "moderation.deactivate_account")).to be_present
    expect(
      described_class.call(admin: admin, report: create(:report, subject_type: "conversation",
                                                                subject_id: create(:conversation).id)).error_code
    ).to eq(:validation_failed)
    expect(described_class.call(admin: create(:user), report: missing).error_code).to eq(:forbidden)
    expect(described_class.call(admin: admin, report: nil).error_code).to eq(:not_found)
  end

  it "deactivates a message sender and keeps a trail when deactivate raises" do
    admin = create(:user, :admin)
    sender = create(:user)
    conversation = create_direct_between(sender.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: sender.account)
    report = create(:report, subject_type: "message", subject_id: message.id)
    described_class.call(admin: admin, report: report)
    expect(sender.account.reload).to be_deactivated

    other = create(:user)
    exploding = create(:report, subject_type: "account", subject_id: other.account_id)
    allow(Users::Deactivate).to receive(:call).and_raise(RuntimeError, "boom")
    expect { described_class.call(admin: admin, report: exploding) }.to raise_error(RuntimeError, "boom")
    expect(AuditEvent.where(action: "moderation.deactivate_account").count).to eq(2)
  end
end

RSpec.describe Admin::Reports::Preview do
  it "builds previews for every subject type including missing rows" do
    account = create(:account)
    bot = create(:bot)
    conversation = create(:conversation)
    create(:conversation_membership, :owner, conversation: conversation, account: account)
    message = create(:message, conversation: conversation, sender_account: account, body: "hi")

    expect(described_class.call(create(:report, subject_type: "account", subject_id: account.id)).label)
      .to eq(account.display_name)
    expect(described_class.call(create(:report, subject_type: "bot", subject_id: bot.id)).account_id)
      .to eq(bot.account_id)
    expect(described_class.call(create(:report, subject_type: "conversation", subject_id: conversation.id)).label)
      .to eq(conversation.title)
    expect(described_class.call(create(:report, subject_type: "message", subject_id: message.id)).body).to eq("hi")
    expect(described_class.call(create(:report, subject_type: "account", subject_id: 9_999_999)).label)
      .to eq(Catalog.t("errors.not_found"))
    expect(described_class.call(create(:report, subject_type: "bot", subject_id: 9_999_999)).label)
      .to eq(Catalog.t("errors.not_found"))
    expect(described_class.call(create(:report, subject_type: "conversation", subject_id: 9_999_999)).label)
      .to eq(Catalog.t("errors.not_found"))
    expect(described_class.call(create(:report, subject_type: "message", subject_id: 9_999_999)).label)
      .to eq(Catalog.t("errors.not_found"))
  end

  it "joins member names when a conversation has no title" do
    left = create(:account, display_name: "Ada")
    right = create(:account, display_name: "Priya")
    conversation = create_direct_between(left, right)
    preview = described_class.call(create(:report, subject_type: "conversation", subject_id: conversation.id))
    expect(preview.label).to include("Ada")
    expect(preview.conversation_id).to eq(conversation.id)
  end
end

RSpec.describe Admin::Reports::Recipients do
  it "resolves owners, senders, and bot accounts" do
    owner = create(:user)
    conversation = create(:conversation)
    create(:conversation_membership, :owner, conversation: conversation, account: owner.account)
    expect(described_class.call(create(:report, subject_type: "conversation", subject_id: conversation.id)))
      .to eq([ owner.account ])

    bot = create(:bot, owner_account: owner.account)
    expect(described_class.call(create(:report, subject_type: "bot", subject_id: bot.id)))
      .to contain_exactly(bot.account, owner.account)
    expect(described_class.call(create(:report, subject_type: "conversation", subject_id: 9_999_999))).to eq([])
    expect(described_class.call(create(:report, subject_type: "message", subject_id: 9_999_999))).to eq([])
    expect(described_class.call(create(:report, subject_type: "account", subject_id: 9_999_999))).to eq([])
    expect(described_class.call(create(:report, subject_type: "bot", subject_id: 9_999_999))).to eq([])
  end
end
# rubocop:enable RSpec/AnyInstance
# rubocop:enable RSpec/MultipleDescribes, RSpec/ExampleLength, RSpec/MultipleExpectations
