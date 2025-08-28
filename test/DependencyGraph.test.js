const { DependencyGraph } = require('../lib/DependencyGraph.js');

describe('DependencyGraph', () => {
  describe('Initialization', () => {
    test('should create an empty graph', () => {
      const graph = new DependencyGraph();
      expect(graph.nodes.size).toBe(0);
      expect(graph.edges.size).toBe(0);
      expect(graph.incomingEdges.size).toBe(0);
    });
  });

  describe('Node Management', () => {
    test('should add a new node', () => {
      const graph = new DependencyGraph();
      expect(graph.addNode('A')).toBe(true);
      expect(graph.nodes.size).toBe(1);
      expect(graph.nodes.has('A')).toBe(true);
    });

    test('should not add a duplicate node', () => {
      const graph = new DependencyGraph();
      graph.addNode('A');
      expect(graph.addNode('A')).toBe(false);
      expect(graph.nodes.size).toBe(1);
    });

    test('should remove an existing node and its edges', () => {
      const graph = new DependencyGraph();
      graph.addEdge('A', 'B', 'link');
      graph.addEdge('C', 'A', 'link');
      expect(graph.removeNode('A')).toBe(true);
      expect(graph.nodes.size).toBe(2);
      expect(graph.nodes.has('A')).toBe(false);
      expect(graph.edges.has('A->B')).toBe(false);
      expect(graph.edges.has('C->A')).toBe(false);
      expect(graph.incomingEdges.get('B').has('A')).toBe(false);
    });
    
    test('should not remove a non-existent node', () => {
      const graph = new DependencyGraph();
      expect(graph.removeNode('A')).toBe(false);
    });
  });

  describe('Edge Management', () => {
    test('should add an edge and create nodes if they do not exist', () => {
      const graph = new DependencyGraph();
      graph.addEdge('A', 'B', 'equational');
      expect(graph.nodes.size).toBe(2);
      expect(graph.edges.size).toBe(1);
      expect(graph.edges.has('A->B')).toBe(true);
      expect(graph.nodes.get('A').has('B')).toBe(true);
      expect(graph.incomingEdges.get('B').has('A')).toBe(true);
    });

    test('should remove an existing edge', () => {
      const graph = new DependencyGraph();
      graph.addEdge('A', 'B', 'equational');
      expect(graph.removeEdge('A', 'B')).toBe(true);
      expect(graph.edges.size).toBe(0);
      expect(graph.nodes.get('A').has('B')).toBe(false);
      expect(graph.incomingEdges.get('B').has('A')).toBe(false);
    });
    
    test('should not remove a non-existent edge', () => {
      const graph = new DependencyGraph();
      graph.addNode('A');
      graph.addNode('B');
      expect(graph.removeEdge('A', 'B')).toBe(false);
    });
  });

  describe('Traversal', () => {
    let graph;
    
    beforeEach(() => {
      graph = new DependencyGraph();
      graph.addEdge('A', 'B', 'type1');
      graph.addEdge('A', 'C', 'type2');
      graph.addEdge('B', 'D', 'type1');
      graph.addEdge('E', 'A', 'type2');
    });

    test('should perform a basic outgoing traversal', () => {
      const path = graph.traverse('A').sort();
      expect(path).toEqual(['A', 'B', 'C', 'D']);
    });

    test('should perform a basic incoming traversal', () => {
      const path = graph.traverse('A', { direction: 'incoming' }).sort();
      expect(path).toEqual(['A', 'E']);
    });

    test('should filter outgoing traversal by a single edge type', () => {
      const path = graph.traverse('A', { edgeTypes: 'type1' }).sort();
      expect(path).toEqual(['A', 'B', 'D']);
    });

    test('should filter incoming traversal by a single edge type', () => {
      const path = graph.traverse('A', { direction: 'incoming', edgeTypes: 'type1' }).sort();
      expect(path).toEqual(['A']);
    });
    
    test('should filter outgoing traversal by multiple edge types', () => {
      const path = graph.traverse('A', { edgeTypes: ['type1', 'type2'] }).sort();
      expect(path).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  describe('Circular Dependency Detection', () => {
    test('should return false for a graph with no cycles', () => {
      const graph = new DependencyGraph();
      graph.addEdge('A', 'B', 'link');
      graph.addEdge('B', 'C', 'link');
      expect(graph.hasCircularDependency()).toBe(false);
      expect(graph.findCircularDependency()).toBeNull();
    });

    test('should detect a simple cycle', () => {
      const graph = new DependencyGraph();
      graph.addEdge('A', 'B', 'link');
      graph.addEdge('B', 'A', 'link');
      expect(graph.hasCircularDependency()).toBe(true);
      expect(graph.findCircularDependency()).toEqual(['A', 'B', 'A']);
    });

    test('should detect a longer cycle', () => {
      const graph = new DependencyGraph();
      graph.addEdge('A', 'B', 'link');
      graph.addEdge('B', 'C', 'link');
      graph.addEdge('C', 'A', 'link');
      expect(graph.hasCircularDependency()).toBe(true);
      expect(graph.findCircularDependency()).toEqual(['A', 'B', 'C', 'A']);
    });

    test('should not detect a cycle when filtered by edge type', () => {
      const graph = new DependencyGraph();
      graph.addEdge('A', 'B', 'type1');
      graph.addEdge('B', 'A', 'type2');
      expect(graph.hasCircularDependency({ edgeTypes: 'type1' })).toBe(false);
      expect(graph.findCircularDependency({ edgeTypes: 'type1' })).toBeNull();
    });
    
    test('should detect a cycle when the type matches the filter', () => {
      const graph = new DependencyGraph();
      graph.addEdge('A', 'B', 'type1');
      graph.addEdge('B', 'C', 'type1');
      graph.addEdge('C', 'A', 'type2'); // This edge is not part of the cycle
      graph.addEdge('C', 'B', 'type1'); // This creates a B->C->B cycle
      expect(graph.hasCircularDependency({ edgeTypes: 'type1' })).toBe(true);
      expect(graph.findCircularDependency({ edgeTypes: 'type1' })).toEqual(['B', 'C', 'B']);
    });
  });

  describe('Mermaid Visualization', () => {
    test('should generate a correct Mermaid string for a complex graph', () => {
      const graph = new DependencyGraph();
      graph.addEdge('A1', 'B1', 'equational');
      graph.addEdge('A1', 'C1', 'equational');
      graph.addNode('D1'); // Standalone node
      const mermaidString = graph.toMermaid();
      const expectedParts = [
        'graph TD;',
        'A1["A1"];',
        'B1["B1"];',
        'C1["C1"];',
        'D1["D1"];',
        'A1 -- equational --> B1;',
        'A1 -- equational --> C1;'
      ];
      expectedParts.forEach(part => {
        expect(mermaidString).toContain(part);
      });
    });

    test('should generate a correct string for an empty graph', () => {
      const graph = new DependencyGraph();
      expect(graph.toMermaid()).toBe('graph TD;\n');
    });
  });
});
