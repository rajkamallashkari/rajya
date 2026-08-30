module Invites
  List = Struct.new(:invites, keyword_init: true)
  PreviewData = Struct.new(
    :invite, :conversation, :member_count, :viewer, :already_member, :pending_request,
    keyword_init: true
  )
  JoinOutcome = Struct.new(:status, :conversation, keyword_init: true)
end
