class ReportReasonListResource < ApplicationResource
  attribute :reasons do
    object.reasons.map { |row| { "id" => row.id, "label" => row.label } }
  end
end
