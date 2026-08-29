module Conversations
  class ReconcileSidebarJob < ApplicationJob
    queue_as :background

    def perform
      Conversations::ReconcileSidebar.call
    end
  end
end
