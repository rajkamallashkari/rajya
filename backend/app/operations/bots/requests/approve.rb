module Bots
  module Requests
    class Approve < ApplicationOperation
      def call(admin:, request:)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) if request.nil?
        return failure(:conflict) unless request.pending?

        affected = nil
        BotRequest.transaction do
          affected = request.edit_kind? ? apply_edit!(request) : build_bot!(request)
          request.update!(status: "approved", bot: affected, decline_reason: nil)
        end
        success(affected)
      rescue ActiveRecord::RecordInvalid
        failure(:validation_failed)
      end

      private

      def build_bot!(request)
        username = request.proposed_username
        return fail_username unless Auth::Usernames.available?(username)

        account = Account.create!(
          kind: "bot", username: username, display_name: request.proposed_name, bio: request.proposed_bio
        )
        Bot.create!(
          account: account, owner_account: request.requester_account,
          persona_prompt: request.proposed_persona_prompt
        )
      end

      def apply_edit!(request)
        bot = request.target_bot
        raise ActiveRecord::RecordInvalid, request if bot.nil?

        username = request.proposed_username
        unless username.casecmp?(bot.account.username) || Auth::Usernames.available?(username, except_id: bot.account_id)
          raise ActiveRecord::RecordInvalid, request
        end

        bot.account.update!(
          display_name: request.proposed_name, username: username, bio: request.proposed_bio
        )
        bot.update!(persona_prompt: request.proposed_persona_prompt)
        bot
      end

      def fail_username
        raise ActiveRecord::RecordInvalid, BotRequest.new
      end
    end
  end
end
