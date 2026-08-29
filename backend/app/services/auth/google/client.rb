require "net/http"
require "uri"
require "json"

# GIS auth-code exchange. redirect_uri is always `postmessage` — the legacy
# server-redirect callback is not implemented (F-25).
module Auth
  module Google
    class Client
      TOKEN_URI = URI("https://oauth2.googleapis.com/token")
      PROFILE_URI = URI("https://www.googleapis.com/oauth2/v3/userinfo")
      POSTMESSAGE_REDIRECT = "postmessage"
      HTTP_OK = "200"

      Profile = Struct.new(:ok?, :info, keyword_init: true)

      def self.profile_from_code(code)
        new.profile_from_code(code)
      end

      def initialize(requester: Requester.new)
        @requester = requester
      end

      def profile_from_code(code)
        token = fetch_access_token(code)
        return failure if token.blank?

        info = fetch_profile(token)
        return failure if info.blank? || info["sub"].blank?

        Profile.new(ok?: true, info: info)
      rescue StandardError
        failure
      end

      private

      def fetch_access_token(code)
        response = @requester.post_form(
          TOKEN_URI,
          {
            "code" => code,
            "grant_type" => "authorization_code",
            "client_id" => client_id,
            "client_secret" => client_secret,
            "redirect_uri" => POSTMESSAGE_REDIRECT
          }
        )
        return if response.nil? || response.code != HTTP_OK

        JSON.parse(response.body)["access_token"]
      rescue JSON::ParserError
        nil
      end

      def fetch_profile(access_token)
        response = @requester.get_with_bearer(PROFILE_URI, access_token)
        return if response.nil? || response.code != HTTP_OK

        parsed = JSON.parse(response.body)
        parsed.is_a?(Hash) ? parsed : nil
      rescue JSON::ParserError
        nil
      end

      def client_id
        Rails.application.credentials.dig(:google, :client_id).presence || ENV["GOOGLE_CLIENT_ID"]
      end

      def client_secret
        Rails.application.credentials.dig(:google, :client_secret).presence || ENV["GOOGLE_CLIENT_SECRET"]
      end

      def failure
        Profile.new(ok?: false, info: nil)
      end
    end
  end
end
