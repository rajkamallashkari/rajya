require "rails_helper"

RSpec.describe ConversationFolderListResource do
  it "nests folders" do
    folder = create(:conversation_folder, name: "Work")
    json = described_class.new(Folders::List.new(folders: [ folder ])).to_h

    expect(json.fetch("folders").sole.fetch("name")).to eq("Work")
  end
end
