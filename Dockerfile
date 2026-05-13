FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PROTO_HOME=/root/.proto
ENV PATH=/root/.proto/shims:/root/.proto/bin:$PATH
ENV WORKSHOP_MODE=live
ENV EVALITE_DB_PATH=/workspace/.evalite/evalite.db
ENV EVALITE_RESULT_PATH=/workspace/.evalite/results/latest.json
ENV EVALITE_PORT=3006
ENV EVALITE_SCORE_THRESHOLD=60
ENV EVALITE_MAX_CONCURRENCY=4
ENV EVALITE_TEST_TIMEOUT_MS=90000
ENV LIVE_LLM_ENABLED=true
ENV OPENROUTER_MODEL=openrouter/owl-alpha
ENV OPENROUTER_JUDGE_MODEL=openrouter/owl-alpha
ENV OPENROUTER_TIMEOUT_MS=60000

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    g++ \
    git \
    jq \
    libatomic1 \
    make \
    python3 \
    ripgrep \
    unzip \
    xz-utils \
    zsh \
  && rm -rf /var/lib/apt/lists/*

RUN bash -c 'bash <(curl -fsSL https://moonrepo.dev/install/proto.sh)'

WORKDIR /workspace

COPY .prototools package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/evals-presentation/package.json apps/evals-presentation/package.json
COPY packages/presentation-core/package.json packages/presentation-core/package.json
RUN proto install
RUN pnpm install --frozen-lockfile

COPY . .

ENTRYPOINT ["bash", "./scripts/docker-entrypoint.sh"]
CMD ["pnpm", "run", "smoke"]
