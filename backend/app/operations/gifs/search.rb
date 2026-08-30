module Gifs
  class Search < ApplicationOperation
    def call(account:, query:, client: Gifs::Tenor.new)
      return failure(:not_found) unless FeatureFlag.enabled?(:gif_search, account: account)
      return failure(:validation_failed) if query.to_s.strip.length < Settings.fetch(:gif_search_min_query_length)

      hits = client.search(query.to_s.strip)
      return failure(:upstream_failed) if hits == :missing_key || hits == :upstream_failed

      success(List.new(gifs: Array(hits).map { |hit| Hit.new(id: hit.id, title: hit.title, preview_url: hit.preview_url) }))
    end
  end
end
