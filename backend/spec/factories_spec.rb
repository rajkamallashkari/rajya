# Every factory must build a persistable, valid record (MASTER_PLAN.md §5) —
# this is the one spec allowed to loop over `FactoryBot.factories` instead of
# describing behaviour, because its entire job is exercising every factory.
require "rails_helper"

RSpec.describe "Factories" do
  FactoryBot.factories.map(&:name).each do |factory_name|
    it "creates a valid #{factory_name}" do
      expect(create(factory_name)).to be_persisted
    end
  end
end
