type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

declare namespace Cloudflare {
  interface Env {
    RESEND_API_KEY: string;
  }
}
