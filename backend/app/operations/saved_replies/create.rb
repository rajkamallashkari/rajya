module SavedReplies
  class Create < ApplicationOperation
    def call(account:, shortcut:, body:, position: 0)
      return failure(:forbidden) if account.blank?

      row = SavedReply.new(
        account: account,
        shortcut: shortcut.to_s.strip,
        body: body.to_s.strip,
        position: position.to_i
      )
      row.save!
      success(row)
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique
      failure(:validation_failed)
    end
  end
end
