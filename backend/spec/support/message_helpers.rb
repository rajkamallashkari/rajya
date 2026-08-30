module MessageHelpers
  def stub_setting(key, value, category: "messaging")
    create(:app_setting, key: key.to_s, value: value, category: category)
  end

  def blob_signed_id(filename: "pic.png", content_type: "image/png", io: StringIO.new("img"))
    ActiveStorage::Blob.create_and_upload!(io: io, filename: filename, content_type: content_type).signed_id
  end
end
