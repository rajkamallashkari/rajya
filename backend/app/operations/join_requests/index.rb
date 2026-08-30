module JoinRequests
  class Index < ApplicationOperation
    def call(conversation:)
      rows = conversation.join_requests.pending_open.includes(:account).order(:created_at).to_a
      success(List.new(join_requests: rows))
    end
  end
end
