require "open3"

module Monitoring
  class Disk
    Sample = Struct.new(:path, :used_bytes, :total_bytes, :percent, :ok, keyword_init: true)

    class << self
      def sample(path: ENV.fetch("DISK_ALERT_PATH", "/"), runner: nil)
        runner ||= method(:read_df)
        parse(path, runner.call(path))
      rescue StandardError
        Sample.new(path: path, used_bytes: 0, total_bytes: 0, percent: 0, ok: false)
      end

      def parse(path, output)
        line = output.to_s.lines.drop(1).find { |row| row.strip != "" }
        fields = line.to_s.split
        return Sample.new(path: path, used_bytes: 0, total_bytes: 0, percent: 0, ok: false) if fields.size < 5

        total_k = Integer(fields[1], 10)
        used_k = Integer(fields[2], 10)
        percent = Integer(fields[-2].to_s.delete("%"), 10)
        # rubocop:disable Rajya/NoMagicNumbers -- POSIX df -k reports 1024-byte blocks
        block = 1_024
        # rubocop:enable Rajya/NoMagicNumbers
        Sample.new(
          path: path,
          used_bytes: used_k * block,
          total_bytes: total_k * block,
          percent: percent,
          ok: true
        )
      rescue ArgumentError
        Sample.new(path: path, used_bytes: 0, total_bytes: 0, percent: 0, ok: false)
      end

      private

      def read_df(path)
        out, status = Open3.capture2("df", "-k", "-P", path)
        raise StandardError, "df_failed" unless status.success?

        out
      end
    end
  end
end
