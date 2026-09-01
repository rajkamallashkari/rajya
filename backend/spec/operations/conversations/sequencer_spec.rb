require "rails_helper"

RSpec.describe Conversations::Sequencer do
  it "allocates gapless positions and independent revisions (BR-31)" do
    conversation = create(:conversation)
    first = described_class.next_send!(conversation.id)
    mutation = described_class.next_revision!(conversation.id)
    second = described_class.next_send!(conversation.id)

    expect(first).to eq([ 1, 1 ])
    expect(mutation).to eq(2)
    expect(second).to eq([ 2, 3 ])
  end

  it "raises when the conversation is missing" do
    expect { described_class.next_send!(0) }.to raise_error(ActiveRecord::RecordNotFound)
    expect { described_class.next_revision!(0) }.to raise_error(ActiveRecord::RecordNotFound)
  end
end
