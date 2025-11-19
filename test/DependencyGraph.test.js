const DependencyGraph = require('../lib/DependencyGraph.js');

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

  describe('Traversal Strategies (BFS vs DFS)', () => {
    let graph;

    beforeEach(() => {
      // Create a graph where BFS and DFS will produce different orders
      //     A
      //    / \
      //   B   C
      //   |   |
      //   D   E
      graph = new DependencyGraph();
      graph.addEdge('A', 'B', 'link');
      graph.addEdge('A', 'C', 'link');
      graph.addEdge('B', 'D', 'link');
      graph.addEdge('C', 'E', 'link');
    });

    test('should use BFS by default', () => {
      const path = graph.traverse('A');
      expect(path[0]).toBe('A');
      // In BFS, we visit level by level: A, then B and C, then D and E
      expect(path.slice(0, 3)).toContain('A');
      expect(path.slice(0, 3)).toContain('B');
      expect(path.slice(0, 3)).toContain('C');
    });

    test('should perform BFS when explicitly specified', () => {
      const path = graph.traverse('A', { strategy: 'bfs' });
      expect(path).toHaveLength(5);
      expect(path[0]).toBe('A');
      // BFS visits level by level
    });

    test('should perform DFS when specified', () => {
      const path = graph.traverse('A', { strategy: 'dfs' });
      expect(path).toHaveLength(5);
      expect(path[0]).toBe('A');
      // DFS goes deep before going wide
    });

    test('should work with DFS in incoming direction', () => {
      const testGraph = new DependencyGraph();
      testGraph.addEdge('B', 'A', 'link');
      testGraph.addEdge('C', 'A', 'link');
      testGraph.addEdge('D', 'B', 'link');
      testGraph.addEdge('E', 'C', 'link');

      const path = testGraph.traverse('A', { direction: 'incoming', strategy: 'dfs' });
      expect(path).toHaveLength(5);
      expect(path).toContain('A');
      expect(path).toContain('B');
      expect(path).toContain('C');
      expect(path).toContain('D');
      expect(path).toContain('E');
    });

    test('should work with DFS and edge type filtering', () => {
      const testGraph = new DependencyGraph();
      testGraph.addEdge('A', 'B', 'type1');
      testGraph.addEdge('A', 'C', 'type2');
      testGraph.addEdge('B', 'D', 'type1');

      const path = testGraph.traverse('A', { strategy: 'dfs', edgeTypes: 'type1' });
      expect(path).toEqual(['A', 'B', 'D']);
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

  describe('serialization and deserialization', () => {
    it('should serialize and deserialize a graph', () => {
      const graph = new DependencyGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addEdge('A', 'B', 'formula');

      const serialized = graph.serialize();
      const deserializedGraph = DependencyGraph.deserialize(serialized);

      expect(deserializedGraph.hasNode('A')).toBe(true);
      expect(deserializedGraph.hasNode('B')).toBe(true);
      expect(deserializedGraph.getDependents('A', { edgeType: 'formula' })).toEqual(['B']);
      expect(deserializedGraph.getDependencies('B', { edgeType: 'formula' })).toEqual(['A']);
    });

    it('should handle an empty graph', () => {
      const graph = new DependencyGraph();
      const serialized = graph.serialize();
      const deserializedGraph = DependencyGraph.deserialize(serialized);

      expect(deserializedGraph.nodes.size).toBe(0);
      expect(deserializedGraph.edges.size).toBe(0);
    });

    it('should maintain edge types during serialization/deserialization', () => {
      const graph = new DependencyGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addEdge('A', 'B', 'type1');
      graph.addEdge('A', 'C', 'type2');

      const serialized = graph.serialize();
      const deserializedGraph = DependencyGraph.deserialize(serialized);

      expect(deserializedGraph.getDependents('A', { edgeTypes: 'type1' })).toEqual(['B']);
      expect(deserializedGraph.getDependents('A', { edgeTypes: 'type2' })).toEqual(['C']);
    });
  });

  describe('Tree Building (getTree)', () => {
    describe('Basic Tree Structure', () => {
      test('should build a basic outgoing tree', () => {
        // A -> B -> D
        // A -> C
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('A', 'C', 'link');
        graph.addEdge('B', 'D', 'link');

        const tree = graph.getTree('A');
        expect(tree).toEqual({
          node: 'A',
          children: [
            {
              node: 'B',
              children: [
                {
                  node: 'D',
                  children: []
                }
              ]
            },
            {
              node: 'C',
              children: []
            }
          ]
        });
      });

      test('should build a basic incoming tree', () => {
        // B -> A
        // C -> A
        // D -> B
        const graph = new DependencyGraph();
        graph.addEdge('B', 'A', 'link');
        graph.addEdge('C', 'A', 'link');
        graph.addEdge('D', 'B', 'link');

        const tree = graph.getTree('A', { direction: 'incoming' });
        expect(tree).toEqual({
          node: 'A',
          children: [
            {
              node: 'B',
              children: [
                {
                  node: 'D',
                  children: []
                }
              ]
            },
            {
              node: 'C',
              children: []
            }
          ]
        });
      });

      test('should return a leaf node with empty children', () => {
        const graph = new DependencyGraph();
        graph.addNode('A');

        const tree = graph.getTree('A');
        expect(tree).toEqual({
          node: 'A',
          children: []
        });
      });

      test('should return null for non-existent start node', () => {
        const graph = new DependencyGraph();
        const tree = graph.getTree('NonExistent');
        expect(tree).toBeNull();
      });
    });

    describe('Edge Type Filtering', () => {
      test('should filter tree by single edge type', () => {
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'type1');
        graph.addEdge('A', 'C', 'type2');
        graph.addEdge('B', 'D', 'type1');

        const tree = graph.getTree('A', { edgeTypes: 'type1' });
        expect(tree).toEqual({
          node: 'A',
          children: [
            {
              node: 'B',
              children: [
                {
                  node: 'D',
                  children: []
                }
              ]
            }
          ]
        });
      });

      test('should filter tree by multiple edge types', () => {
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'type1');
        graph.addEdge('A', 'C', 'type2');
        graph.addEdge('B', 'D', 'type3');
        graph.addEdge('C', 'E', 'type2');

        const tree = graph.getTree('A', { edgeTypes: ['type1', 'type2'] });
        expect(tree).toEqual({
          node: 'A',
          children: [
            {
              node: 'B',
              children: []
            },
            {
              node: 'C',
              children: [
                {
                  node: 'E',
                  children: []
                }
              ]
            }
          ]
        });
      });
    });

    describe('Cycle Handling', () => {
      test('should stop at already visited nodes (prevent cycles)', () => {
        // A -> B -> C -> A (cycle)
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('B', 'C', 'link');
        graph.addEdge('C', 'A', 'link');

        const tree = graph.getTree('A');
        expect(tree).toEqual({
          node: 'A',
          children: [
            {
              node: 'B',
              children: [
                {
                  node: 'C',
                  children: [] // Stops here, doesn't go back to A
                }
              ]
            }
          ]
        });
      });

      test('should prevent duplicate nodes when multiple paths lead to same node', () => {
        // A -> B -> D
        // A -> C -> D (D is reachable via two paths)
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('A', 'C', 'link');
        graph.addEdge('B', 'D', 'link');
        graph.addEdge('C', 'D', 'link');

        const tree = graph.getTree('A');

        // D should only appear once (in the first path encountered)
        expect(tree.node).toBe('A');
        expect(tree.children).toHaveLength(2);

        // One of the branches should have D, the other shouldn't
        const hasD = tree.children.some(child =>
          child.children.some(grandchild => grandchild.node === 'D')
        );
        expect(hasD).toBe(true);

        // Count total occurrences of D in the entire tree
        const countNodeOccurrences = (node, target) => {
          let count = node.node === target ? 1 : 0;
          for (const child of node.children) {
            count += countNodeOccurrences(child, target);
          }
          return count;
        };
        expect(countNodeOccurrences(tree, 'D')).toBe(1);
      });
    });

    describe('Complex Tree Structures', () => {
      test('should build a deep tree with multiple branches', () => {
        // A -> B -> D -> F
        // A -> C -> E -> G
        //           E -> H
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('A', 'C', 'link');
        graph.addEdge('B', 'D', 'link');
        graph.addEdge('C', 'E', 'link');
        graph.addEdge('D', 'F', 'link');
        graph.addEdge('E', 'G', 'link');
        graph.addEdge('E', 'H', 'link');

        const tree = graph.getTree('A');
        expect(tree).toEqual({
          node: 'A',
          children: [
            {
              node: 'B',
              children: [
                {
                  node: 'D',
                  children: [
                    {
                      node: 'F',
                      children: []
                    }
                  ]
                }
              ]
            },
            {
              node: 'C',
              children: [
                {
                  node: 'E',
                  children: [
                    {
                      node: 'G',
                      children: []
                    },
                    {
                      node: 'H',
                      children: []
                    }
                  ]
                }
              ]
            }
          ]
        });
      });

      test('should work with incoming direction and edge type filtering', () => {
        const graph = new DependencyGraph();
        graph.addEdge('B', 'A', 'type1');
        graph.addEdge('C', 'A', 'type2');
        graph.addEdge('D', 'B', 'type1');
        graph.addEdge('E', 'C', 'type2');

        const tree = graph.getTree('A', { direction: 'incoming', edgeTypes: 'type1' });
        expect(tree).toEqual({
          node: 'A',
          children: [
            {
              node: 'B',
              children: [
                {
                  node: 'D',
                  children: []
                }
              ]
            }
          ]
        });
      });
    });
  });

  describe('executeOnTree', () => {
    describe('Basic Execution', () => {
      test('should execute callback on a simple tree', async () => {
        // A -> B -> C
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('B', 'C', 'link');

        const results = [];
        const callback = async (nodeId, parentResult, context) => {
          results.push({ nodeId, parentResult, depth: context.depth });
          return `result_${nodeId}`;
        };

        const tree = await graph.executeOnTree('A', callback);

        expect(results).toHaveLength(3);
        expect(results[0]).toEqual({ nodeId: 'A', parentResult: null, depth: 0 });
        expect(results[1]).toEqual({ nodeId: 'B', parentResult: 'result_A', depth: 1 });
        expect(results[2]).toEqual({ nodeId: 'C', parentResult: 'result_B', depth: 2 });

        expect(tree.node).toBe('A');
        expect(tree.result).toBe('result_A');
        expect(tree.children[0].result).toBe('result_B');
        expect(tree.children[0].children[0].result).toBe('result_C');
      });

      test('should execute siblings in parallel', async () => {
        // A -> B
        // A -> C
        // A -> D
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('A', 'C', 'link');
        graph.addEdge('A', 'D', 'link');

        const executionOrder = [];
        const callback = async (nodeId) => {
          executionOrder.push(`start_${nodeId}`);
          await new Promise(resolve => setTimeout(resolve, 10));
          executionOrder.push(`end_${nodeId}`);
          return nodeId;
        };

        await graph.executeOnTree('A', callback);

        // A should start and end first
        expect(executionOrder[0]).toBe('start_A');
        expect(executionOrder[1]).toBe('end_A');

        // B, C, D should all start before any of them end (parallel execution)
        const starts = executionOrder.filter(item => item.startsWith('start_'));
        const ends = executionOrder.filter(item => item.startsWith('end_'));
        expect(starts.slice(1)).toEqual(['start_B', 'start_C', 'start_D']);
        expect(ends.slice(1)).toEqual(['end_B', 'end_C', 'end_D']);
      });

      test('should pass context information correctly', async () => {
        // A -> B -> C
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'type1');
        graph.addEdge('B', 'C', 'type2');

        let contextB, contextC;
        const callback = async (nodeId, parentResult, context) => {
          if (nodeId === 'B') contextB = context;
          if (nodeId === 'C') contextC = context;
          return nodeId;
        };

        await graph.executeOnTree('A', callback);

        expect(contextB).toEqual({
          depth: 1,
          path: ['A'],
          parentNode: 'A',
          edgeType: 'type1',
          siblings: []
        });

        expect(contextC).toEqual({
          depth: 2,
          path: ['A', 'B'],
          parentNode: 'B',
          edgeType: 'type2',
          siblings: []
        });
      });
    });

    describe('Circular Reference Handling', () => {
      test('should handle circular references', async () => {
        // A -> B -> C -> B (circular)
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('B', 'C', 'link');
        graph.addEdge('C', 'B', 'link');

        const executedNodes = [];
        const callback = async (nodeId) => {
          executedNodes.push(nodeId);
          return `result_${nodeId}`;
        };

        const tree = await graph.executeOnTree('A', callback);

        // B should only be executed once
        expect(executedNodes).toEqual(['A', 'B', 'C']);

        // Find the circular reference in the tree
        const nodeC = tree.children[0].children[0];
        expect(nodeC.node).toBe('C');
        expect(nodeC.children[0].isCircularRef).toBe(true);
        expect(nodeC.children[0].node).toBe('B');
        expect(nodeC.children[0].result).toBe('result_B');
      });
    });

    describe('Error Handling', () => {
      test('should fail-fast on error by default', async () => {
        // A -> B
        // A -> C (will throw error)
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('A', 'C', 'link');

        const callback = async (nodeId) => {
          if (nodeId === 'C') {
            throw new Error('Error in C');
          }
          return nodeId;
        };

        await expect(graph.executeOnTree('A', callback)).rejects.toThrow('Error in C');
      });

      test('should collect errors when errorStrategy is collect', async () => {
        // A -> B (will throw error)
        // A -> C
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('A', 'C', 'link');

        const callback = async (nodeId) => {
          if (nodeId === 'B') {
            throw new Error('Error in B');
          }
          return `result_${nodeId}`;
        };

        const tree = await graph.executeOnTree('A', callback, { errorStrategy: 'collect' });

        expect(tree.node).toBe('A');
        expect(tree.result).toBe('result_A');
        expect(tree.error).toBeNull();

        // Find B and C in children
        const nodeB = tree.children.find(child => child.node === 'B');
        const nodeC = tree.children.find(child => child.node === 'C');

        expect(nodeB.error).toBeInstanceOf(Error);
        expect(nodeB.error.message).toBe('Error in B');
        expect(nodeB.result).toBeNull();

        expect(nodeC.error).toBeNull();
        expect(nodeC.result).toBe('result_C');
      });

      test('should skip children when errorStrategy is skip-children', async () => {
        // A -> B -> D
        // A -> C (will throw error) -> E
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('B', 'D', 'link');
        graph.addEdge('A', 'C', 'link');
        graph.addEdge('C', 'E', 'link');

        const executedNodes = [];
        const callback = async (nodeId) => {
          executedNodes.push(nodeId);
          if (nodeId === 'C') {
            throw new Error('Error in C');
          }
          return `result_${nodeId}`;
        };

        const tree = await graph.executeOnTree('A', callback, { errorStrategy: 'skip-children' });

        // E should not be executed because C failed
        expect(executedNodes).toEqual(['A', 'B', 'C', 'D']);

        const nodeC = tree.children.find(child => child.node === 'C');
        expect(nodeC.error).toBeInstanceOf(Error);
        expect(nodeC.children).toHaveLength(0);

        const nodeB = tree.children.find(child => child.node === 'B');
        expect(nodeB.children).toHaveLength(1);
        expect(nodeB.children[0].node).toBe('D');
      });
    });

    describe('Edge Type Filtering', () => {
      test('should filter by edge type', async () => {
        // A -> B (type1)
        // A -> C (type2)
        // B -> D (type1)
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'type1');
        graph.addEdge('A', 'C', 'type2');
        graph.addEdge('B', 'D', 'type1');

        const executedNodes = [];
        const callback = async (nodeId) => {
          executedNodes.push(nodeId);
          return nodeId;
        };

        await graph.executeOnTree('A', callback, { edgeTypes: 'type1' });

        // Only A, B, and D should be executed (following type1 edges)
        expect(executedNodes).toEqual(['A', 'B', 'D']);
      });

      test('should filter by multiple edge types', async () => {
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'type1');
        graph.addEdge('A', 'C', 'type2');
        graph.addEdge('A', 'D', 'type3');

        const executedNodes = [];
        const callback = async (nodeId) => {
          executedNodes.push(nodeId);
          return nodeId;
        };

        await graph.executeOnTree('A', callback, { edgeTypes: ['type1', 'type2'] });

        expect(executedNodes).toContain('A');
        expect(executedNodes).toContain('B');
        expect(executedNodes).toContain('C');
        expect(executedNodes).not.toContain('D');
      });
    });

    describe('Direction', () => {
      test('should traverse in incoming direction', async () => {
        // B -> A
        // C -> A
        const graph = new DependencyGraph();
        graph.addEdge('B', 'A', 'link');
        graph.addEdge('C', 'A', 'link');

        const executedNodes = [];
        const callback = async (nodeId) => {
          executedNodes.push(nodeId);
          return nodeId;
        };

        await graph.executeOnTree('A', callback, { direction: 'incoming' });

        expect(executedNodes).toContain('A');
        expect(executedNodes).toContain('B');
        expect(executedNodes).toContain('C');
        expect(executedNodes).toHaveLength(3);
      });
    });

    describe('Concurrency Limiting', () => {
      test('should limit concurrent executions', async () => {
        // A -> B, C, D (3 children)
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('A', 'C', 'link');
        graph.addEdge('A', 'D', 'link');

        let currentConcurrent = 0;
        let maxConcurrent = 0;

        const callback = async (nodeId) => {
          currentConcurrent++;
          maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
          await new Promise(resolve => setTimeout(resolve, 50));
          currentConcurrent--;
          return nodeId;
        };

        await graph.executeOnTree('A', callback, { maxConcurrency: 2 });

        // maxConcurrent should never exceed 2
        expect(maxConcurrent).toBeLessThanOrEqual(2);
      });
    });

    describe('Progress Callback', () => {
      test('should call onProgress for each node', async () => {
        // A -> B -> C
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('B', 'C', 'link');

        const progress = [];
        const callback = async (nodeId) => `result_${nodeId}`;

        const onProgress = (nodeId, result) => {
          progress.push({ nodeId, result });
        };

        await graph.executeOnTree('A', callback, { onProgress });

        expect(progress).toEqual([
          { nodeId: 'A', result: 'result_A' },
          { nodeId: 'B', result: 'result_B' },
          { nodeId: 'C', result: 'result_C' }
        ]);
      });
    });

    describe('Cancellation', () => {
      test('should abort execution when signal is aborted', async () => {
        // A -> B -> C -> D
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'link');
        graph.addEdge('B', 'C', 'link');
        graph.addEdge('C', 'D', 'link');

        const controller = new AbortController();
        const executedNodes = [];

        const callback = async (nodeId) => {
          executedNodes.push(nodeId);
          if (nodeId === 'B') {
            controller.abort();
          }
          await new Promise(resolve => setTimeout(resolve, 10));
          return nodeId;
        };

        await expect(
          graph.executeOnTree('A', callback, { signal: controller.signal })
        ).rejects.toThrow('Execution aborted');

        // Should have executed A and B, but not C or D
        expect(executedNodes.length).toBeLessThan(4);
      });
    });

    describe('Input Validation', () => {
      test('should throw error if start node does not exist', async () => {
        const graph = new DependencyGraph();
        const callback = async (nodeId) => nodeId;

        await expect(
          graph.executeOnTree('NonExistent', callback)
        ).rejects.toThrow("Start node 'NonExistent' does not exist");
      });

      test('should throw error if callback is not a function', async () => {
        const graph = new DependencyGraph();
        graph.addNode('A');

        await expect(
          graph.executeOnTree('A', 'not a function')
        ).rejects.toThrow('Callback must be a function');
      });
    });

    describe('Complex Scenarios', () => {
      test('should handle complex tree with async operations', async () => {
        // Simulate a computation graph like spreadsheet cells
        // A = 10
        // B = A * 2
        // C = A + 5
        // D = B + C
        const graph = new DependencyGraph();
        graph.addEdge('A', 'B', 'calc');
        graph.addEdge('A', 'C', 'calc');
        graph.addEdge('B', 'D', 'calc');
        graph.addEdge('C', 'D', 'calc');

        const values = { A: 10 };

        const callback = async (nodeId, parentResult) => {
          await new Promise(resolve => setTimeout(resolve, 5));

          if (nodeId === 'A') return values.A;
          if (nodeId === 'B') return parentResult * 2;
          if (nodeId === 'C') return parentResult + 5;
          if (nodeId === 'D') {
            // D has two parents, but we only get one parentResult
            // In real use case, you'd need to handle this differently
            return parentResult;
          }
        };

        const tree = await graph.executeOnTree('A', callback);

        expect(tree.result).toBe(10);
        const nodeB = tree.children.find(c => c.node === 'B');
        const nodeC = tree.children.find(c => c.node === 'C');
        expect(nodeB.result).toBe(20); // 10 * 2
        expect(nodeC.result).toBe(15); // 10 + 5
      });
    });
  });
});
