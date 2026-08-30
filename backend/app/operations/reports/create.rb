module Reports
  class Create < ApplicationOperation
    def call(reporter:, subject_type:, subject_id:, reason:, details: nil)
      type = subject_type.to_s
      id = subject_id.to_i
      code = reason.to_s
      note = details.to_s.strip
      note = nil if note.empty?

      return failure(:not_found) unless Report::SUBJECT_TYPES.include?(type)
      return failure(:not_found) if id < 1
      return failure(:not_found) unless subject_exists?(reporter, type, id)
      return failure(:validation_failed) if self_subject?(reporter, type, id)
      return failure(:validation_failed) unless allowed_reason?(code)
      return failure(:validation_failed) if note && note.length > Settings.fetch(:max_message_length)
      return failure(:conflict) if open_duplicate?(reporter, type, id)
      return failure(:rate_limited) if cooling_down?(reporter, type, id)

      report = Report.create!(
        reporter_account: reporter, subject_type: type, subject_id: id, reason: code, details: note
      )
      notify_admins(report)
      success(report)
    rescue ActiveRecord::RecordNotUnique
      failure(:conflict)
    end

    private

    def allowed_reason?(code)
      Array(Settings.fetch(:report_reasons)).map(&:to_s).include?(code)
    end

    def open_duplicate?(reporter, type, id)
      Report.pending.exists?(reporter_account: reporter, subject_type: type, subject_id: id)
    end

    def cooling_down?(reporter, type, id)
      last = Report.where(reporter_account: reporter, subject_type: type, subject_id: id)
                   .order(created_at: :desc).first
      return false if last.nil?

      last.created_at > Time.current - Settings.fetch(:report_cooldown).seconds
    end

    def self_subject?(reporter, type, id)
      return reporter.id == id if type == "account"
      return false unless type == "message"

      Message.where(id: id).pick(:sender_account_id) == reporter.id
    end

    def subject_exists?(reporter, type, id)
      case type
      when "account" then Account.exists?(id: id)
      when "bot" then Bot.exists?(id: id)
      when "conversation"
        Conversation.exists?(id: id) && active_member?(reporter, id)
      else
        message = Message.find_by(id: id)
        message.present? && active_member?(reporter, message.conversation_id)
      end
    end

    def active_member?(reporter, conversation_id)
      ConversationMembership.active.exists?(account_id: reporter.id, conversation_id: conversation_id)
    end

    def notify_admins(report)
      flagged = auto_flagged?(report)
      User.where(is_admin: true).includes(:account).find_each do |admin|
        Realtime.publish(
          admin.account, :report_created,
          "report_id" => report.id, "subject_type" => report.subject_type,
          "subject_id" => report.subject_id, "reason" => report.reason,
          "status" => report.status, "auto_flagged" => flagged
        )
        next if admin.email.blank?

        ModerationMailer.report(user: admin, report: report, auto_flagged: flagged).deliver_now
      end
    end

    def auto_flagged?(report)
      Report.pending.where(subject_type: report.subject_type, subject_id: report.subject_id).count >=
        Settings.fetch(:auto_flag_threshold)
    end
  end
end
