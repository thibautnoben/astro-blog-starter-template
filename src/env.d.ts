type Runtime = import("@astrojs/cloudflare").Runtime;

declare namespace App {
  interface Locals extends Runtime {}
}

declare namespace Cloudflare {
  interface Env {
    RESEND_API_KEY: string;
    TURNSTILE_SITE_KEY: string;
    TURNSTILE_SECRET_KEY: string;
  }
}
