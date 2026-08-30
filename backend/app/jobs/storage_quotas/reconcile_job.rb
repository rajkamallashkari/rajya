module StorageQuotas
  class ReconcileJob < ApplicationJob
    queue_as :background

    def perform(account_id = nil)
      Reconcile.call(account: account_id && Account.find_by(id: account_id))
    end
  end
end
