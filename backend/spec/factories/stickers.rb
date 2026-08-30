FactoryBot.define do
  factory :sticker do
    sticker_pack
    sequence(:shortcode) { |n| "wave#{n}" }
    blob do
      ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new("img"), filename: "sticker.png", content_type: "image/png"
      )
    end
  end
end
