class ReportResource < ApplicationResource
  attributes :id, :subject_type, :subject_id, :reason, :details, :status, :created_at
end
