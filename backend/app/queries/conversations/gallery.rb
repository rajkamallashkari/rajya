module Conversations
  class Gallery < ApplicationQuery
    KINDS = {
      "images" => %w[image video],
      "files" => %w[file audio],
      "links" => "links"
    }.freeze

    Result = Struct.new(:items, :page, :per_page, :total, :has_more, keyword_init: true)

    def initialize(conversation:, kind:, page: 1)
      @conversation = conversation
      @kind = kind.to_s
      @page = [ page.to_i, 1 ].max
    end

    def self.known_kind?(kind)
      KINDS.key?(kind.to_s)
    end

    def call
      per_page = Settings.fetch(:gallery_page_size)
      records, total = slice(per_page)
      Result.new(
        items: records,
        page: @page,
        per_page: per_page,
        total: total,
        has_more: total > @page * per_page
      )
    end

    private

    def slice(per_page)
      relation = scoped
      total = relation.unscope(:order).count
      offset = (@page - 1) * per_page
      [ relation.offset(offset).limit(per_page).to_a, total ]
    end

    def scoped
      return links_scope if @kind == "links"

      Attachment
        .joins(:message)
        .where(messages: { conversation_id: @conversation.id, deleted_at: nil })
        .where(kind: KINDS.fetch(@kind))
        .includes(:message, file_attachment: :blob, thumbnail_attachment: :blob)
        .order(id: :desc)
    end

    def links_scope
      LinkPreview
        .joins(message_link_previews: :message)
        .where(messages: { conversation_id: @conversation.id, deleted_at: nil })
        .where(status: "ready")
        .distinct
        .order(id: :desc)
    end
  end
end
