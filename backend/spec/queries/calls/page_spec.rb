require "rails_helper"

RSpec.describe Calls::Page do
  it "names a direct call after the peer" do
    user = create(:user)
    peer = create(:account)
    direct = create_direct_call_log(user.account, peer: peer)
    entry = described_class.call(account: user.account, scope: Call.where(id: direct.id)).calls.sole

    expect(entry.title).to eq(peer.display_name)
    expect(entry.peer).to eq(peer)
  end

  it "leaves a direct call unnamed when only the viewer took part" do
    user = create(:user)
    direct = create_direct_call_log(user.account, peer: create(:account))
    direct.call_participants.where.not(account_id: user.account.id).destroy_all
    entry = described_class.call(account: user.account, scope: Call.where(id: direct.id)).calls.sole

    expect(entry).to have_attributes(title: nil, peer: nil)
  end

  it "names a group call after the conversation" do
    user = create(:user)
    group = create_talk(kind: "group", owner: user.account, members: create_list(:account, 2))
    call = create(:call, :ended, conversation: group, initiator_account: user.account)
    group.accounts.each { |row| create(:call_participant, call: call, account: row, status: "left") }
    entry = described_class.call(account: user.account, scope: Call.where(id: call.id)).calls.sole

    expect(entry).to have_attributes(title: group.title, peer: nil)
  end

  it "treats a blank page as the first page" do
    page = described_class.call(account: create(:account), scope: Call.none, page: 0)

    expect(page.page).to eq(1)
    expect(page.calls).to eq([])
  end

  context "when measuring N+1", :n_plus_one do
    let(:holder) { {} }

    populate do |count|
      owner = create(:user)
      count.times do
        peer = create(:account)
        conversation = create_direct_between(owner.account, peer)
        call = create(:call, :ended, conversation: conversation, initiator_account: owner.account)
        create(:call_participant, call: call, account: owner.account, status: "left")
        create(:call_participant, call: call, account: peer, status: "left")
      end
      holder[:account] = owner.account
    end

    it "does not grow queries as the call log grows (F-4)" do
      Settings.fetch(:call_page_size)
      expect do
        CallListResource.new(
          described_class.call(
            account: holder.fetch(:account),
            scope: CallPolicy::Scope.new(holder.fetch(:account), Call.all).resolve
          )
        ).to_h
      end.to perform_constant_number_of_queries
    end
  end
end
