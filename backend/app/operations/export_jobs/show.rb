module ExportJobs
  class Show < ApplicationOperation
    def call(job:)
      success(job)
    end
  end
end
