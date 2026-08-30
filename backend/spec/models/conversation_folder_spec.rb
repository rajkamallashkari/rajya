require "rails_helper"

RSpec.describe ConversationFolder do
  it "rejects a blank or overlong name" do
    expect(build(:conversation_folder, name: "")).not_to be_valid
    stub_setting(:folder_name_max_length, 2, category: "groups")
    expect(build(:conversation_folder, name: "too")).not_to be_valid
  end

  it "accepts a name within the configured length" do
    expect(build(:conversation_folder, name: "Work")).to be_valid
  end
end
