# Placeholder until session 0.2 scaffolds the Rails 8 API-only app.
# Production Compose builds this context; the real image lands with the skeleton.

FROM ruby:4.0.3-slim

WORKDIR /rails

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libpq-dev build-essential && \
    rm -rf /var/lib/apt/lists/*

# Session 0.2 will COPY Gemfile / app and run bundle install + bootsnap precompile.
CMD ["echo", "Rajya backend image not built yet — complete session 0.2"]
