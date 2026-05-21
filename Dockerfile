FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PROTO_HOME=/root/.proto
ENV PATH=/root/.proto/shims:/root/.proto/bin:$PATH
ENV WORKSHOP_MODE=live
ENV EVALITE_DB_PATH=/workspace/.evalite/evalite.db
ENV EVALITE_RESULT_PATH=/workspace/.evalite/results/latest.json
ENV EVALITE_PORT=3006
ENV EVALITE_SCORE_THRESHOLD=60
ENV EVALITE_MAX_CONCURRENCY=1
ENV EVALITE_TEST_TIMEOUT_MS=90000
ENV LIVE_LLM_ENABLED=true
ENV AI_PROXY_BASE_URL=https://ai-proxy-zane.web-revolution.cz
ENV AI_PROXY_MODEL=gpt-5.2-codex
ENV AI_PROXY_JUDGE_MODEL=gpt-5.2-codex
ENV AI_PROXY_FALLBACK_MODELS=gpt-5.4-mini,gemini-3-flash-preview,claude-haiku-4.5,gpt-5.3-codex
ENV AI_PROXY_TIMEOUT_MS=60000

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

COPY .prototools package.json pnpm-lock.yaml ./
RUN proto install
RUN pnpm install --frozen-lockfile

COPY . .

ENTRYPOINT ["bash", "./scripts/docker-entrypoint.sh"]
CMD ["pnpm", "run", "smoke"]
