class DirectUploadResource < ApplicationResource
  attributes :blob_signed_id, :direct_upload_url, :headers, :bucket_service_name, :skip_upload
end
