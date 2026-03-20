// Mock API — replace with real API calls once psf.3 backend is complete
// TODO: Replace with real API calls when psf.3 (AI Service) is complete.
// See: uml_diagram-psf.3
export async function mockGenerate(prompt: string, diagramType: string): Promise<{ source: string; diagramType: string }> {
  await new Promise(r => setTimeout(r, 800));
  return {
    source: `graph TD\n  A[${prompt.slice(0, 20)}] --> B[Result]`,
    diagramType,
  };
}

export async function mockRefine(prompt: string, currentSource: string): Promise<{ source: string }> {
  await new Promise(r => setTimeout(r, 600));
  return {
    source: currentSource + `\n  %% refined: ${prompt.slice(0, 20)}`,
  };
}
