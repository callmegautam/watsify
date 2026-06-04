declare module "qrcode-terminal" {
  interface GenerateOptions {
    small?: boolean;
  }
  export function generate(
    text: string,
    options?: GenerateOptions,
    callback?: (qrcode: string) => void,
  ): void;
}
