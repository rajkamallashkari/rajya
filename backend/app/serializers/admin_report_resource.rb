class AdminReportResource < ApplicationResource
  attribute :id do
    object.report.id
  end

  attribute :subject_type do
    object.report.subject_type
  end

  attribute :subject_id do
    object.report.subject_id
  end

  attribute :reason do
    object.report.reason
  end

  attribute :details do
    object.report.details
  end

  attribute :status do
    object.report.status
  end

  attribute :resolution_note do
    object.report.resolution_note
  end

  attribute :reviewed_by_user_id do
    object.report.reviewed_by_user_id
  end

  attribute :reviewed_at do
    object.report.reviewed_at
  end

  attribute :created_at do
    object.report.created_at
  end

  attribute :reporter do
    AccountResource.new(object.report.reporter_account).to_h
  end

  attribute :subject do
    AdminReportSubjectResource.new(object.subject).to_h
  end
end
