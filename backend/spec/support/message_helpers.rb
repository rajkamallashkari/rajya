module MessageHelpers
  def stub_setting(key, value, category: "messaging")
    create(:app_setting, key: key.to_s, value: value, category: category)
  end

  def blob_signed_id(filename: "pic.png", content_type: "image/png", io: StringIO.new("img"))
    ActiveStorage::Blob.create_and_upload!(io: io, filename: filename, content_type: content_type).signed_id
  end

  def disable_receipts!(account)
    pref = account.preference || account.create_preference!
    data = pref.data.is_a?(Hash) ? pref.data.deep_dup : {}
    data["privacy"] ||= {}
    data["privacy"]["read_receipts"] = false
    pref.update!(data: data)
    account.reload
  end
end
