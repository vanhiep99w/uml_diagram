import { getMockDiagrams, deleteMockDiagram, renameMockDiagram, resetMockDiagrams } from '@/lib/mock-diagrams';

describe('mock-diagrams', () => {
  beforeEach(() => {
    resetMockDiagrams();
  });

  it('getMockDiagrams returns an array', () => {
    const diagrams = getMockDiagrams();
    expect(Array.isArray(diagrams)).toBe(true);
  });

  it('each diagram has id, title, diagramType, updatedAt fields', () => {
    const diagrams = getMockDiagrams();
    expect(diagrams.length).toBeGreaterThan(0);
    for (const diagram of diagrams) {
      expect(diagram).toHaveProperty('id');
      expect(diagram).toHaveProperty('title');
      expect(diagram).toHaveProperty('diagramType');
      expect(diagram).toHaveProperty('updatedAt');
    }
  });

  it('deleteMockDiagram removes diagram from list', () => {
    const before = getMockDiagrams();
    const firstId = before[0].id;
    deleteMockDiagram(firstId);
    const after = getMockDiagrams();
    expect(after.find(d => d.id === firstId)).toBeUndefined();
    expect(after.length).toBe(before.length - 1);
  });

  it('renameMockDiagram updates title', () => {
    const diagrams = getMockDiagrams();
    const target = diagrams[0];
    renameMockDiagram(target.id, 'New Title');
    const updated = getMockDiagrams().find(d => d.id === target.id);
    expect(updated?.title).toBe('New Title');
  });
});
