class ExportJobListResource < ApplicationResource
  attribute :export_jobs do
    object.export_jobs.map { |row| ExportJobResource.new(row).to_h }
  end
end
