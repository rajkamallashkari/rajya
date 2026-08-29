module Sessions
  List = Struct.new(:sessions, :current_jti, keyword_init: true)

  class Index < ApplicationOperation
    def call(sessions:, current_jti:)
      success(List.new(sessions: sessions.order(last_seen_at: :desc).to_a, current_jti: current_jti))
    end
  end
end
