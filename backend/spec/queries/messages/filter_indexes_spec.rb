require "rails_helper"

# Index existence is asserted with EXPLAIN in spec/queries/search/filter_indexes_spec.rb (P8.2).
# rubocop:disable RSpec/DescribeClass, RSpec/SpecFilePathFormat
RSpec.describe "idx_messages_conversation_sender_position" do
  it "adds the conversation+sender+position index search will use (NR-43)" do
    names = ActiveRecord::Base.connection.indexes(:messages).map(&:name)
    index = ActiveRecord::Base.connection.indexes(:messages).find do |row|
      row.name == "idx_messages_conversation_sender_position"
    end

    expect(names).to include("idx_messages_conversation_sender_position")
    expect(index&.columns).to eq(%w[conversation_id sender_account_id position])
  end
end
# rubocop:enable RSpec/DescribeClass, RSpec/SpecFilePathFormat
