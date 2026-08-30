module ExportJobs
  class Index < ApplicationOperation
    def call(account:, jobs:)
      return failure(:forbidden) if account.blank?

      success(List.new(export_jobs: jobs.order(id: :desc).to_a))
    end
  end
end
