module Uploads
  ResultPayload = Struct.new(
    :blob_signed_id, :direct_upload_url, :headers, :bucket_service_name, :skip_upload,
    keyword_init: true
  )
end
