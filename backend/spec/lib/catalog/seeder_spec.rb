require "rails_helper"

RSpec.describe Catalog::Seeder do
  it "inserts flattened locale keys into translation_strings" do
    described_class.seed!

    row = TranslationString.find_by!(key: "errors.not_found", locale: "en")
    expect(row.value).to eq("The requested resource could not be found.")
  end

  it "does not clobber an admin override" do
    admin = create(:user)
    TranslationString.create!(key: "errors.not_found", locale: "en", value: "Custom.", updated_by_user: admin)

    described_class.seed!

    expect(TranslationString.find_by!(key: "errors.not_found").value).to eq("Custom.")
  end
end
