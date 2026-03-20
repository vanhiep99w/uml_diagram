// TODO: Replace with real API when psf.4 (Diagram CRUD) is complete

export interface Diagram {
  id: string;
  title: string;
  diagramType: string;
  updatedAt: string; // ISO date string
}

const initialMockDiagrams = (): Diagram[] => [
  {
    id: 'mock-1',
    title: 'User Authentication Flow',
    diagramType: 'Sequence',
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    title: 'System Architecture',
    diagramType: 'Class',
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    title: 'Deployment Pipeline',
    diagramType: 'Deployment',
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let mockDiagramStore: Diagram[] = initialMockDiagrams();

export function resetMockDiagrams(): void {
  mockDiagramStore = initialMockDiagrams();
}

export function getMockDiagrams(): Diagram[] {
  return [...mockDiagramStore];
}

export function deleteMockDiagram(id: string): void {
  mockDiagramStore = mockDiagramStore.filter((d) => d.id !== id);
}

export function renameMockDiagram(id: string, newTitle: string): void {
  mockDiagramStore = mockDiagramStore.map((d) =>
    d.id === id ? { ...d, title: newTitle } : d
  );
}

export function addMockDiagram(title: string, diagramType: string = 'Class'): Diagram {
  const newDiagram: Diagram = {
    id: `mock-${Date.now()}`,
    title,
    diagramType,
    updatedAt: new Date().toISOString(),
  };
  mockDiagramStore = [newDiagram, ...mockDiagramStore];
  return newDiagram;
}
