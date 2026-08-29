require "rails_helper"

RSpec.describe ApplicationCable::Connection, type: :channel do
  let(:user) { create(:user) }

  it "connects with a current token and exposes current_user and current_account" do
    connect "/cable?token=#{bearer_token_for(user)}"

    expect(connection.current_user).to eq(user)
    expect(connection.current_account).to eq(user.account)
  end

  it "rejects a token whose credentials_epoch is stale (F-6)" do
    token = bearer_token_for(user)
    user.revoke_all_credentials!

    expect { connect "/cable?token=#{token}" }.to raise_error(
      ActionCable::Connection::Authorization::UnauthorizedError
    )
  end

  it "rejects a connection with no token" do
    expect { connect "/cable" }.to raise_error(ActionCable::Connection::Authorization::UnauthorizedError)
  end
end
