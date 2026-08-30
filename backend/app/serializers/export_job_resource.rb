class ExportJobResource < ApplicationResource
  attributes :id, :conversation_id, :format, :include_media, :status, :expires_at, :created_at

  attribute :error_message do
    next if object.error_message.blank?

    Catalog.t("export.errors.#{object.error_message}")
  end
end
