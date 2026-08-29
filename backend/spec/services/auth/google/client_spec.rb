require "rails_helper"

RSpec.describe Auth::Google::Client do
  let(:requester) { instance_double(Auth::Google::Requester) }
  let(:client) { described_class.new(requester: requester) }
  let(:ok) { instance_double(Net::HTTPResponse, code: "200", body: { access_token: "tok" }.to_json) }
  let(:profile_body) { { "sub" => "abc", "email" => "a@example.com", "name" => "Ada" } }

  def stub_http(token: ok, profile: nil)
    allow(requester).to receive_messages(post_form: token, get_with_bearer: profile)
  end

  def profile_response(body)
    instance_double(Net::HTTPResponse, code: "200", body: body)
  end

  it "exchanges a GIS auth code with redirect_uri=postmessage" do
    stub_http(profile: profile_response(profile_body.to_json))

    profile = client.profile_from_code("the-code")

    expect(profile).to be_ok
    expect(profile.info["sub"]).to eq("abc")
    expect(requester).to have_received(:post_form).with(
      Auth::Google::Client::TOKEN_URI,
      hash_including("code" => "the-code", "redirect_uri" => "postmessage")
    )
  end

  it "fails when Google rejects the code" do
    stub_http(token: instance_double(Net::HTTPResponse, code: "400", body: "{}"))

    expect(client.profile_from_code("bad")).not_to be_ok
  end

  it "fails when the token payload is not JSON" do
    stub_http(token: instance_double(Net::HTTPResponse, code: "200", body: "nope"))

    expect(client.profile_from_code("x")).not_to be_ok
  end

  it "fails when the profile response is not JSON" do
    stub_http(profile: profile_response("nope"))

    expect(client.profile_from_code("x")).not_to be_ok
  end

  it "fails when the profile HTTP status is not OK" do
    stub_http(profile: instance_double(Net::HTTPResponse, code: "401", body: "{}"))

    expect(client.profile_from_code("x")).not_to be_ok
  end

  it "fails when the profile JSON is not an object" do
    stub_http(profile: profile_response("[1]"))

    expect(client.profile_from_code("x")).not_to be_ok
  end

  it "fails when the token HTTP client returns nothing" do
    stub_http(token: nil)

    expect(client.profile_from_code("x")).not_to be_ok
  end

  it "fails when the profile HTTP client returns nothing" do
    stub_http(profile: nil)

    expect(client.profile_from_code("x")).not_to be_ok
  end

  it "reads Google client credentials from Rails credentials when present" do
    allow(Rails.application.credentials).to receive(:dig).with(:google, :client_id).and_return("cred-id")
    allow(Rails.application.credentials).to receive(:dig).with(:google, :client_secret).and_return("cred-secret")
    stub_http(profile: profile_response(profile_body.to_json))

    client.profile_from_code("the-code")

    expect(requester).to have_received(:post_form).with(
      anything,
      hash_including("client_id" => "cred-id", "client_secret" => "cred-secret")
    )
  end

  it "reads Google client credentials from ENV when credentials are empty" do
    allow(Rails.application.credentials).to receive(:dig).and_return(nil)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("GOOGLE_CLIENT_ID").and_return("env-id")
    allow(ENV).to receive(:[]).with("GOOGLE_CLIENT_SECRET").and_return("env-secret")
    stub_http(profile: profile_response(profile_body.to_json))

    client.profile_from_code("the-code")

    expect(requester).to have_received(:post_form).with(
      anything, hash_including("client_id" => "env-id", "client_secret" => "env-secret")
    )
  end

  it "fails when the profile has no sub" do
    stub_http(profile: profile_response({ email: "a@x.com" }.to_json))

    expect(client.profile_from_code("x")).not_to be_ok
  end

  it "fails closed on a transport error" do
    allow(requester).to receive(:post_form).and_raise(SocketError, "down")

    expect(client.profile_from_code("x")).not_to be_ok
  end

  it "delegates .profile_from_code to a new instance" do
    stub_http(profile: profile_response(profile_body.to_json))
    allow(described_class).to receive(:new).and_return(client)

    expect(described_class.profile_from_code("the-code")).to be_ok
  end

  it "builds a Requester when none is injected" do
    expect(described_class.new.instance_variable_get(:@requester)).to be_a(Auth::Google::Requester)
  end
end
