require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Username availability", type: :request do
  path "/api/v1/accounts/username" do
    get "Check whether a username is available" do
      tags "Accounts"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :username, in: :query, type: :string

      response "200", "availability" do
        schema "$ref" => "#/components/schemas/UsernameAvailability"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:username) { "brand_new" }

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("available" => true)
        end
      end
    end
  end
end

RSpec.describe "Account profile", type: :request do
  path "/api/v1/accounts/{id}" do
    get "Show a public profile" do
      tags "Accounts"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "visible, including accounts blocked by the viewer" do
        schema "$ref" => "#/components/schemas/AccountProfile"
        let(:user) { create(:user) }
        let(:target_user) { create(:user, email: "visible@example.com", phone: "+12025550147") }
        let(:target) { target_user.account }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:id) { target.id }

        before do
          create(:contact_nickname, owner_account: user.account, target_account: target, nickname: "Secret")
          target.avatar.attach(io: StringIO.new("png"), filename: "avatar.png", content_type: "image/png")
          create(
            :preference,
            account: target,
            data: { "privacy" => { "show_email_on_profile" => true, "show_phone_on_profile" => false } }
          )
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("id")).to eq(target.id)
          expect(body.fetch("blocked_by_viewer")).to be(false)
          expect(body.fetch("avatar_url")).to include("/rails/active_storage/")
          expect(body.fetch("email")).to eq(target_user.email)
          expect(body).not_to have_key("phone")
          expect(body).not_to have_key("nickname")
        end
      end
    end
  end
end

RSpec.describe "Account common groups", type: :request do
  path "/api/v1/accounts/{id}/common_groups" do
    get "List conversations shared with an account" do
      tags "Accounts"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "shared groups without member rosters" do
        schema "$ref" => "#/components/schemas/ConversationIdentityList"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:id) { target.id }

        before do
          create_talk(kind: "group", owner: user.account, members: [ target ]).update!(title: "Shared")
          create_talk(kind: "group", owner: user.account, members: [ create(:account) ]).update!(title: "Private")
        end

        run_test! do |response|
          group = JSON.parse(response.body).fetch("conversations").sole
          expect(group).to include("title" => "Shared", "member_count" => 2, "avatar_url" => nil)
          expect(group).not_to have_key("members")
        end
      end
    end
  end
end

RSpec.describe "Account common groups blocked", type: :request do
  path "/api/v1/accounts/{id}/common_groups" do
    get "List conversations shared with an account" do
      tags "Accounts"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "404", "account blocking the viewer remains private" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:id) { target.id }

        before do
          create_talk(kind: "group", owner: user.account, members: [ target ]).update!(title: "Hidden")
          create(:block, blocker_account: target, blocked_account: user.account)
        end

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end
end

RSpec.describe "Account profile blocked by viewer", type: :request do
  path "/api/v1/accounts/{id}" do
    get "Show a public profile" do
      tags "Accounts"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "visible, including accounts blocked by the viewer" do
        schema "$ref" => "#/components/schemas/AccountProfile"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:id) { target.id }

        before { create(:block, blocker_account: user.account, blocked_account: target) }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("id")).to eq(target.id)
          expect(body.fetch("blocked_by_viewer")).to be(true)
        end
      end
    end
  end
end

RSpec.describe "Account profile mutually blocked", type: :request do
  path "/api/v1/accounts/{id}" do
    get "Show a public profile" do
      tags "Accounts"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "404", "mutual block (NR-1 invisibility)" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:id) { target.id }

        before do
          create(:block, blocker_account: user.account, blocked_account: target)
          create(:block, blocker_account: target, blocked_account: user.account)
        end

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end
end

RSpec.describe "Account profile blocked reverse", type: :request do
  path "/api/v1/accounts/{id}" do
    get "Show a public profile" do
      tags "Accounts"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "404", "blocked reverse (NR-1 invisibility)" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:id) { target.id }

        before { create(:block, blocker_account: target, blocked_account: user.account) }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
