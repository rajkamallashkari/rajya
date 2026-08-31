require "rails_helper"

RSpec.describe Ai::PromptTemplate do
  describe ".fetch" do
    it "returns the code-defined default when no row exists" do
      expect(described_class.fetch(:bot_reply)).to include("helpful assistant")
    end

    it "returns the highest active DB version without a restart" do
      PromptTemplate.create!(capability: "bot_reply", version: 1, template: "v1", active: true)
      PromptTemplate.create!(capability: "bot_reply", version: 2, template: "v2", active: true)

      expect(described_class.fetch(:bot_reply)).to eq("v2")
    end

    it "skips inactive versions" do
      PromptTemplate.create!(capability: "bot_reply", version: 2, template: "v2", active: false)

      expect(described_class.fetch(:bot_reply)).to include("helpful assistant")
    end

    it "invalidates the cache when a row is updated" do
      row = PromptTemplate.create!(capability: "bot_reply", version: 1, template: "v1", active: true)
      expect(described_class.fetch(:bot_reply)).to eq("v1")

      row.update!(template: "v1-edited")

      expect(described_class.fetch(:bot_reply)).to eq("v1-edited")
    end

    it "raises in local environments for an unregistered capability" do
      expect { described_class.fetch(:not_a_capability) }.to raise_error(Ai::PromptTemplate::UnregisteredCapability)
    end

    it "returns the capability name in production for an unregistered capability" do
      allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production"))

      expect(described_class.fetch(:not_a_capability)).to eq("not_a_capability")
    end

    it "ships defaults for every chat capability" do
      expect(described_class.fetch(:suggest_replies)).to include("reply")
      expect(described_class.fetch(:style_profile)).to include("style")
      expect(described_class.fetch(:conversation_summary)).to include("archiver")
      expect(described_class.fetch(:memory_extract)).to include("NONE")
      expect(described_class.fetch(:memory_context)).to include("Shared memories")
    end
  end
end
