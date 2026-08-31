module PushHelpers
  TEST_VAPID = {
    "VAPID_PUBLIC_KEY" => "BBaForCBp9wMcR7sQYuZUUl7sc-TD6LZXeAIPMx-BIrOTctDCb8Vwa0fIIMkeGiZn-V7MtPySdIP3m-dFvXnoRo=",
    "VAPID_PRIVATE_KEY" => "ngq4um9MMy1kJYhOWmWiPOeXI6pVGuTeH-JcMuYKUko=",
    "VAPID_SUBJECT" => "mailto:test@rajya.local"
  }.freeze

  def with_vapid_env
    previous = TEST_VAPID.keys.index_with { |key| ENV[key] }
    TEST_VAPID.each { |key, value| ENV[key] = value }
    yield
  ensure
    previous.each { |key, value| value.nil? ? ENV.delete(key) : ENV[key] = value }
  end

  def push_http_error(klass)
    response = instance_double(Net::HTTPResponse, inspect: "410 Gone", body: "gone")
    klass.new(response, "push.example.com")
  end
end
