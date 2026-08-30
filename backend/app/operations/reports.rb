module Reports
  Reason = Struct.new(:id, :label, keyword_init: true)
  ReasonList = Struct.new(:reasons, keyword_init: true)
end
