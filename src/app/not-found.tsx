import { ErrorPage } from "@/components/error/ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      statusCode={404}
      showRetry={false}
      showHome={true}
      fullScreen={true}
    />
  );
}
