# Rajya backend — Rails 8 API. Built by docker-compose.yml (production Compose,
# TARGET_ARCHITECTURE.md §1) for both the `web` and `worker` services; `worker`
# overrides CMD to run Solid Queue as a separate process (never SOLID_QUEUE_IN_PUMA).
ARG RUBY_VERSION=4.0.3
FROM ruby:$RUBY_VERSION-slim AS base

WORKDIR /rails

# Runtime dependencies shared by every stage.
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libpq-dev libvips && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives

ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development:test"


FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git pkg-config && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives

COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

COPY . .

RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile 2>/dev/null || true
RUN bootsnap precompile app/ lib/


FROM base

COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails

RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    chown -R rails:rails db log storage tmp
USER 1000:1000

ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 3000
CMD ["./bin/rails", "server"]
