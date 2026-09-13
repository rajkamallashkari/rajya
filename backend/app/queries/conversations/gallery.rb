module Conversations
  class Gallery < ApplicationQuery
    LinkItem = Data.define(:url, :title, :description, :site_name, :message)

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
      return links_slice(per_page) if @kind == "links"

      relation = scoped
      total = relation.unscope(:order).count
      offset = (@page - 1) * per_page
      [ relation.offset(offset).limit(per_page).to_a, total ]
    end

    def scoped
      Attachment
        .joins(:message)
        .where(messages: { conversation_id: @conversation.id, deleted_at: nil })
        .where(kind: KINDS.fetch(@kind))
        .includes(message: :sender_account, file_attachment: :blob, thumbnail_attachment: :blob)
        .order(id: :desc)
    end

    def links_slice(per_page)
      items = link_items
      offset = (@page - 1) * per_page
      [ items.slice(offset, per_page) || [], items.size ]
    end

    def link_items
      messages = @conversation.messages.visible
        .where.not(body: [ nil, "" ])
        .includes(:sender_account, :link_previews)
        .order(id: :desc)

      messages.flat_map do |message|
        previews = message.link_previews.select { |preview| preview.status == "ready" }.index_by(&:url)
        extract_urls(message.body).map do |url|
          preview = previews[url]
          LinkItem.new(
            url: url,
            title: preview&.title,
            description: preview&.description,
            site_name: preview&.site_name,
            message: message
          )
        end
      end
    end

    def extract_urls(body)
      body.to_enum(:scan, URI::DEFAULT_PARSER.make_regexp(%w[http https]))
        .map { Regexp.last_match[0] }
        .map { |url| url.sub(/[)\]}>.,!?;:'"]+\z/, "") }
        .uniq
    end
  end
end
