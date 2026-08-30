require "rails_helper"

RSpec.describe Messages::Send, :concurrent do
  def in_parallel(count, &)
    threads = Array.new(count) do
      Thread.new do
        Rails.application.executor.wrap { ActiveRecord::Base.connection_pool.with_connection(&) }
      end
    end
    threads.each(&:join)
  end

  it "issues unique gapless positions for parallel sends" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    count = 5
    in_parallel(count) { described_class.call(conversation: conversation, sender: user.account, body: "Hi") }

    expect(conversation.messages.order(:position).pluck(:position)).to eq((1..count).to_a)
  end

  it "deduplicates the same client_nonce sent from two threads (F-3)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    nonce = SecureRandom.uuid
    in_parallel(2) do
      described_class.call(conversation: conversation, sender: user.account, body: "Hi", client_nonce: nonce)
    end

    expect(conversation.messages.where(client_nonce: nonce).count).to eq(1)
  end
end
