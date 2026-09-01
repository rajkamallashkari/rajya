module Admin
  module Users
    List = Struct.new(:users, keyword_init: true)
    Item = Struct.new(:user, :conversations, keyword_init: true)

    class Index < ApplicationOperation
      def call(admin:, query: nil)
        return failure(:forbidden) unless admin.is_admin?

        success(List.new(users: Admin::UsersQuery.call(query: query)))
      end
    end

    class Show < ApplicationOperation
      def call(admin:, user:)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) if user.nil?

        success(Item.new(user: user, conversations: Admin::ConversationsQuery.call(account: user.account)))
      end
    end
  end
end
