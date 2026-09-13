require "rails_helper"
require "json"
require "open3"
require "tmpdir"

RSpec.describe Kernel do
  let(:directory) { Dir.mktmpdir }
  let(:interceptor) { File.join(directory, "intercept_exec.rb") }

  before do
    File.write(interceptor, <<~RUBY)
      module Kernel
        def exec(environment, *command)
          puts JSON.generate(environment: environment, command: command)
          exit
        end
      end
    RUBY
  end

  after { FileUtils.remove_entry(directory) }

  it "has bin/dev exec Rails with embedded Solid Queue and the supplied arguments" do
    stdout, stderr, status = Open3.capture3(
      { "RUBYOPT" => "-rjson -r#{interceptor}" },
      Rails.root.join("bin/dev").to_s, "--binding=127.0.0.1",
      chdir: Rails.root.join("tmp").to_s
    )
    payload = JSON.parse(stdout)

    aggregate_failures do
      expect(status).to be_success
      expect(stderr).to be_empty
      expect(payload.fetch("environment")).to eq("SOLID_QUEUE_IN_PUMA" => "true")
      expect(payload.fetch("command")).to eq([ "./bin/rails", "server", "--binding=127.0.0.1" ])
    end
  end

  it "has the root Procfile disable embedding because it runs a separate worker" do
    procfile = Rails.root.join("../Procfile.dev").read

    expect(procfile).to include("web: cd backend && env -u SOLID_QUEUE_IN_PUMA bin/rails server")
    expect(procfile).to include("worker: cd backend && bin/jobs")
  end
end
