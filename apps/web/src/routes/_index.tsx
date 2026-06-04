import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My App" },
    { name: "description", content: "watsify is a web application" },
  ];
}

export default function Home() {
  return <h1>Home</h1>;
}
