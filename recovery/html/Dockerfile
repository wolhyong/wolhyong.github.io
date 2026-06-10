# ============================================
# Stage 1: Jekyll Build
# ============================================
FROM ruby:3.2-slim AS jekyll-builder

LABEL description="GHW Dev Blog - Jekyll Builder"

WORKDIR /app

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Gem 설치
COPY Gemfile Gemfile.lock ./
RUN bundle install

# 소스 코드 복사
COPY . .

# Jekyll 사이트 빌드 (--future 플래그로 미래 날짜 포스트 포함)
RUN bundle exec jekyll build --future

# ============================================
# Stage 2: Nginx Serve
# ============================================
FROM nginx:alpine

LABEL description="GHW Dev Blog - Nginx"

# 불필요한 Nginx 설정 제거
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Jekyll 빌드 결과물 복사
COPY --from=jekyll-builder /app/_site /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
