module ExportJobs
  class GenerateJob < ApplicationJob
    queue_as :low

    def perform(export_job_id)
      Generate.call(export_job_id: export_job_id)
    end
  end
end
