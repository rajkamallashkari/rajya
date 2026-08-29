module Conversations
  class Create < ApplicationOperation
    def call(creator:, kind:, account_id: nil, account_ids: nil, title: nil, description: nil)
      case kind.to_s
      when "direct"
        FindOrCreateDirect.call(creator: creator, account_id: account_id)
      when "group", "channel"
        CreateGroup.call(
          creator: creator, kind: kind, account_ids: account_ids, title: title, description: description
        )
      else
        failure(:validation_failed)
      end
    end
  end
end
