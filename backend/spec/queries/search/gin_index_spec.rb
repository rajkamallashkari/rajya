require "rails_helper"

# rubocop:disable RSpec/DescribeClass, RSpec/SpecFilePathFormat, RSpec/ExampleLength
RSpec.describe "messages.search_vector GIN" do
  it "uses the GIN index for FTS (F-15)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    20.times do |index|
      create(:message, conversation: conversation, sender_account: user.account, body: "needleword #{index}",
                       position: index + 1)
    end
    Message.connection.execute("ANALYZE messages")
    Message.connection.execute("SET enable_seqscan = off")
    relation = Message.visible.where("search_vector @@ to_tsquery('simple', ?)", Search::Tsquery.call("needleword"))
    plan = Message.connection.select_values("EXPLAIN #{relation.to_sql}").join("\n")
    expect(plan).to include("index_messages_on_search_vector")
  ensure
    Message.connection.execute("SET enable_seqscan = on")
  end
end
# rubocop:enable RSpec/DescribeClass, RSpec/SpecFilePathFormat, RSpec/ExampleLength
