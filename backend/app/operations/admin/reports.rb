# Admin moderation queue (SCHEMA §12.11 / NR-39). Every mutating action writes
# `audit_events` first so a later raise still leaves a trail.
module Admin
  module Reports
    List = Struct.new(:reports, keyword_init: true)
    Item = Struct.new(:report, :subject, keyword_init: true)
    Subject = Struct.new(:type, :id, :label, :body, :conversation_id, :account_id,
                         keyword_init: true)

    class Preview
      def self.call(report)
        new(report).call
      end

      def initialize(report)
        @report = report
      end

      def call
        case @report.subject_type
        when "account" then account_subject
        when "bot" then bot_subject
        when "conversation" then conversation_subject
        else message_subject
        end
      end

      private

      def account_subject
        account = Account.find_by(id: @report.subject_id)
        Subject.new(
          type: "account", id: @report.subject_id, label: label_for(account),
          body: nil, conversation_id: nil, account_id: account&.id
        )
      end

      def bot_subject
        bot = Bot.find_by(id: @report.subject_id)
        Subject.new(
          type: "bot", id: @report.subject_id,
          label: label_for(bot&.account), body: nil, conversation_id: nil,
          account_id: bot&.account_id
        )
      end

      def conversation_subject
        conversation = Conversation.find_by(id: @report.subject_id)
        Subject.new(
          type: "conversation", id: @report.subject_id,
          label: conversation_label(conversation), body: nil,
          conversation_id: conversation&.id, account_id: nil
        )
      end

      def message_subject
        message = Message.find_by(id: @report.subject_id)
        Subject.new(
          type: "message", id: @report.subject_id,
          label: label_for(message&.sender_account), body: message&.body,
          conversation_id: message&.conversation_id,
          account_id: message&.sender_account_id
        )
      end

      def label_for(account)
        account&.display_name.presence || Catalog.t("errors.not_found")
      end

      def conversation_label(conversation)
        return Catalog.t("errors.not_found") if conversation.nil?
        return conversation.title if conversation.title.present?

        conversation.accounts.order(:id).map(&:display_name).join(", ")
      end
    end

    class Recipients
      def self.call(report)
        case report.subject_type
        when "account"
          Array(Account.find_by(id: report.subject_id))
        when "bot"
          bot = Bot.find_by(id: report.subject_id)
          [ bot&.account, bot&.owner_account ].compact.uniq
        when "conversation"
          conversation = Conversation.find_by(id: report.subject_id)
          return [] if conversation.nil?

          conversation.conversation_memberships.where(role: "owner").filter_map(&:account)
        else
          message = Message.find_by(id: report.subject_id)
          Array(message&.sender_account)
        end
      end
    end

    class Index < ApplicationOperation
      def call(admin:, status: nil, subject_type: nil, max_age_hours: nil)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:validation_failed) unless valid_status?(status)
        return failure(:validation_failed) unless valid_subject_type?(subject_type)

        rows = Admin::ReportsQuery.call(
          status: status, subject_type: subject_type, max_age_hours: max_age_hours
        )
        success(List.new(reports: rows.map { |row| item_for(row) }))
      end

      private

      def valid_status?(value)
        value.to_s.blank? || Report::STATUSES.include?(value.to_s)
      end

      def valid_subject_type?(value)
        value.to_s.blank? || Report::SUBJECT_TYPES.include?(value.to_s)
      end

      def item_for(report)
        Item.new(report: report, subject: Preview.call(report))
      end
    end

    class Show < ApplicationOperation
      def call(admin:, report:)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) if report.nil?

        success(Item.new(report: report, subject: Preview.call(report)))
      end
    end

    class Action < ApplicationOperation
      def call(admin:, report:, note: nil, ip: nil)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) if report.nil?
        return failure(:conflict) unless open?(report)
        return failure(:validation_failed) unless valid_note?(note)

        audit!(admin, report, ip)
        perform!(admin, report)
        close!(report, admin, note)
        success(Item.new(report: report.reload, subject: Preview.call(report)))
      end

      private

      def open?(report)
        report.status.in?(%w[pending reviewing])
      end

      def valid_note?(note)
        text = note.to_s
        return true if text.blank?

        text.length <= ::Settings.fetch(:max_message_length)
      end

      def audit!(admin, report, ip)
        Audit::Record.call(
          admin: admin,
          action: audit_action,
          impersonated_account: Recipients.call(report).first,
          target: report,
          metadata: { "subject_type" => report.subject_type, "subject_id" => report.subject_id },
          ip: ip
        )
      end

      def close!(report, admin, note)
        text = note.to_s.strip
        report.update!(
          status: close_status,
          reviewed_by_user: admin,
          reviewed_at: Time.current,
          resolution_note: text.presence
        )
      end

      def perform!(_admin, _report); end
    end

    class Dismiss < Action
      def audit_action = "moderation.dismiss"
      def close_status = "dismissed"
    end

    class Warn < Action
      def audit_action = "moderation.warn"
      def close_status = "actioned"

      def perform!(_admin, report)
        Recipients.call(report).each do |account|
          Realtime.publish(
            account, :moderation_warning,
            "report_id" => report.id, "reason" => report.reason
          )
          user = account.user
          next if user&.email.blank?

          ModerationMailer.warning(user: user, report: report).deliver_now
        end
      end
    end

    class RemoveContent < Action
      def call(admin:, report:, note: nil, ip: nil)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) if report.nil?
        return failure(:validation_failed) unless report.subject_type.in?(%w[message bot])

        super
      end

      def audit_action = "moderation.remove_content"
      def close_status = "actioned"

      def perform!(_admin, report)
        report.subject_type == "bot" ? deactivate_bot!(report) : tombstone_message!(report)
      end

      def tombstone_message!(report)
        message = Message.find_by(id: report.subject_id)
        raise ActiveRecord::RecordNotFound if message.nil?
        return if message.deleted?

        Message.transaction do
          message.update!(
            deleted_at: Time.current,
            body: nil,
            revision: ::Conversations::Sequencer.next_revision!(message.conversation_id)
          )
        end
        Realtime.publish(
          "conversation:#{message.conversation_id}", :message_deleted, "message_id" => message.id
        )
      end

      def deactivate_bot!(report)
        bot = Bot.find_by(id: report.subject_id)
        raise ActiveRecord::RecordNotFound if bot.nil?
        return if bot.deactivated?

        bot.deactivate!
      end
    end

    class DeactivateAccount < Action
      def call(admin:, report:, note: nil, ip: nil)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) if report.nil?
        return failure(:validation_failed) if report.subject_type == "conversation"

        super
      end

      def audit_action = "moderation.deactivate_account"
      def close_status = "actioned"

      def perform!(_admin, report)
        account = Recipients.call(report).first
        raise ActiveRecord::RecordNotFound if account.nil?

        if account.bot?
          bot = account.bot
          raise ActiveRecord::RecordNotFound if bot.nil?

          bot.deactivate! unless bot.deactivated?
          return
        end

        user = account.user
        raise ActiveRecord::RecordNotFound if user.nil?

        ::Users::Deactivate.call(user: user)
      end
    end
  end
end
