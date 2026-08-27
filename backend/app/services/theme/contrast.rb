# WCAG relative-luminance contrast (NR-48). Writes that would drop a semantic
# token below AA against its paired surface/text are rejected at the model.
module Theme
  class Contrast
    AA_RATIO = 4.5
    LUMINANCE_OFFSET = 0.05
    SRGB_CUTOFF = 0.03928
    SRGB_LINEAR_DIVISOR = 12.92
    SRGB_GAMMA_OFFSET = 0.055
    SRGB_GAMMA_DIVISOR = 1.055
    SRGB_GAMMA = 2.4
    CHANNEL_MAX = 255.0
    HEX_PAIR = 2
    RED_WEIGHT = 0.2126
    GREEN_WEIGHT = 0.7152
    BLUE_WEIGHT = 0.0722
    WHITE = "#FFFFFF"
    NEAR_BLACK = "#0E1621"

    class << self
      def sufficient?(foreground, background)
        ratio(foreground, background) >= AA_RATIO
      end

      def accent_readable?(hex)
        sufficient?(hex, WHITE) || sufficient?(hex, NEAR_BLACK)
      end

      def ratio(left, right)
        first, second = relative_luminance(left), relative_luminance(right)
        lighter, darker = [ first, second ].max, [ first, second ].min
        (lighter + LUMINANCE_OFFSET) / (darker + LUMINANCE_OFFSET)
      end

      def relative_luminance(hex)
        red, green, blue = srgb_channels(hex).map { |channel| linearize(channel) }
        (RED_WEIGHT * red) + (GREEN_WEIGHT * green) + (BLUE_WEIGHT * blue)
      end

      private

      def srgb_channels(hex)
        hex.delete("#").scan(/.{#{HEX_PAIR}}/).map { |pair| pair.to_i(16) / CHANNEL_MAX }
      end

      def linearize(channel)
        if channel <= SRGB_CUTOFF
          channel / SRGB_LINEAR_DIVISOR
        else
          ((channel + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_DIVISOR)**SRGB_GAMMA
        end
      end
    end
  end
end
