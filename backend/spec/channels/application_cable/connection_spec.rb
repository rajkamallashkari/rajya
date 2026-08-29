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

  it "rejects a revoked jti while another session on the same user still connects (NR-44)" do
    first = Auth::Session.issue(user)
    second = Auth::Session.issue(user)
    ::Session.find_by!(jti: Auth::Token.decode(first.token).fetch("jti")).revoke!

    expect { connect "/cable?token=#{first.token}" }.to raise_error(
      ActionCable::Connection::Authorization::UnauthorizedError
    )
    connect "/cable?token=#{second.token}"
    expect(connection.current_user).to eq(user)
  end

  it "rejects a connection when the revoked-jti cache cannot be read" do
    token = bearer_token_for(user)
    allow(Auth::RevokedJtis).to receive(:read_set).and_raise(Redis::BaseError, "down")

    expect { connect "/cable?token=#{token}" }.to raise_error(
      ActionCable::Connection::Authorization::UnauthorizedError
    )
  end

  it "rejects a connection with no token" do
    expect { connect "/cable" }.to raise_error(ActionCable::Connection::Authorization::UnauthorizedError)
  end
end
