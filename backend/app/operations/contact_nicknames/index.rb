module ContactNicknames
  List = Struct.new(:nicknames, keyword_init: true)

  class Index < ApplicationOperation
    def call(nicknames:)
      success(List.new(nicknames: nicknames.includes(:target_account).order(:nickname).to_a))
    end
  end
end
