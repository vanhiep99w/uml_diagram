interface EditorWithIdPageProps {
  params: { id: string };
}

export default function EditorWithIdPage({ params }: EditorWithIdPageProps) {
  return (
    <div>
      <p>Loading diagram {params.id}...</p>
    </div>
  );
}
