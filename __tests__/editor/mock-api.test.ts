import { mockGenerate, mockRefine } from '@/lib/mock-api';

describe('mock-api', () => {
  describe('mockGenerate', () => {
    it('returns an object with { source: string, diagramType: string }', async () => {
      const result = await mockGenerate('Create a class diagram', 'Class');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('diagramType');
      expect(typeof result.source).toBe('string');
      expect(typeof result.diagramType).toBe('string');
    });

    it('is async (returns a Promise)', () => {
      const promise = mockGenerate('Create a class diagram', 'Class');
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('mockRefine', () => {
    it('returns an object with { source: string }', async () => {
      const result = await mockRefine('Add inheritance', 'classDiagram\nA <|-- B');
      expect(result).toHaveProperty('source');
      expect(typeof result.source).toBe('string');
    });

    it('is async (returns a Promise)', () => {
      const promise = mockRefine('Add inheritance', 'classDiagram\nA <|-- B');
      expect(promise).toBeInstanceOf(Promise);
    });
  });
});
