class AdminReportListResource < ApplicationResource
  attribute :reports do
    object.reports.map { |item| AdminReportResource.new(item).to_h }
  end
end
