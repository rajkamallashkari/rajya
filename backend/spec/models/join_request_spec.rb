require "rails_helper"

RSpec.describe JoinRequest do
  it "is valid as a pending request" do
    expect(build(:join_request)).to be_valid
  end

  it "rejects an unknown status" do
    request = build(:join_request, status: "banned")
    expect(request).not_to be_valid
  end

  it "enforces one request per account per conversation" do
    existing = create(:join_request)
    duplicate = build(:join_request, conversation: existing.conversation, account: existing.account)
    expect(duplicate).not_to be_valid
  end

  it "exposes status predicates" do
    pending = build(:join_request, status: "pending", created_at: Time.current)
    approved = build(:join_request, :approved)
    rejected = build(:join_request, :rejected)

    expect(pending).to be_pending
    expect(approved).to be_approved
    expect(rejected).to be_rejected
  end

  it "treats stale pending rows as expired and resolved rows as current" do
    pending = build(:join_request, status: "pending", created_at: Time.current)
    approved = build(:join_request, :approved)
    stale = build(:join_request, created_at: Time.current - Settings.fetch(:join_request_expiry).seconds - 1)

    expect(pending).not_to be_expired
    expect(stale).to be_expired
    expect(approved).not_to be_expired
  end

  it "lists only unexpired pending rows" do
    conversation = create(:conversation)
    open_row = create(:join_request, conversation: conversation, account: create(:account))
    create(:join_request, :approved, conversation: conversation, account: create(:account))
    create(:join_request, conversation: conversation, account: create(:account),
                          created_at: Time.current - Settings.fetch(:join_request_expiry).seconds - 1)

    expect(described_class.pending_open).to contain_exactly(open_row)
  end
end
