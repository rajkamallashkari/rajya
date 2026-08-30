module ExportJobs
  List = Struct.new(:export_jobs, keyword_init: true)
  UrlPayload = Struct.new(:url, :expires_at, keyword_init: true)
end
