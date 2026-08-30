module Reports
  class Reasons < ApplicationOperation
    def call
      reasons = Array(Settings.fetch(:report_reasons)).map do |id|
        Reason.new(id: id.to_s, label: Catalog.t("report.reasons.#{id}"))
      end
      success(ReasonList.new(reasons: reasons))
    end
  end
end
