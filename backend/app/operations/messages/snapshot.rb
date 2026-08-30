module Messages
  module Snapshot
    module_function

    def for(account)
      {
        "id" => account.id,
        "username" => account.username,
        "display_name" => account.display_name,
        "kind" => account.kind
      }
    end
  end
end
