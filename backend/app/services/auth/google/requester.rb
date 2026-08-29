require "net/http"
require "uri"

module Auth
  module Google
    class Requester
      def post_form(uri, params)
        Net::HTTP.post_form(uri, params)
      end

      def get_with_bearer(uri, token)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        request = Net::HTTP::Get.new(uri)
        request["Authorization"] = "Bearer #{token}"
        http.request(request)
      end
    end
  end
end
