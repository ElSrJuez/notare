interface Props {
  html: string;
}

export default function ArticleViewer({ html }: Props) {
  if (!html) return null;
  return (
    <article
      className="prose lg:prose-lg bg-white p-6 rounded shadow max-w-3xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
