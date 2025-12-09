# Dependency Graph

A versatile JavaScript library for creating, managing, and analyzing directed graphs. This module also includes a powerful utility for extracting cell and range references from Excel-style formula strings.

It is designed to be lightweight, with zero production dependencies, making it easy to integrate into any Node.js project.

## Features

- **Dependency Graph:**
  - Create directed graphs with typed edges.
  - Add and remove nodes and edges dynamically.
  - Traverse the graph using breadth-first search (BFS) or depth-first search (DFS).
  - Build hierarchical tree structures representing graph relationships.
  - Execute async operations on tree nodes with waterfall-style result passing and parallel sibling execution.
  - Support traversal in both outgoing (dependencies) and incoming (dependents) directions.
  - Filter traversal by edge types.
  - Detect and find circular dependencies.
  - Generate graph visualizations using Mermaid.js syntax.

- **Excel Formula Parsing:**
  - Extract cell references (e.g., `A1`, `Sheet1!B2`).
  - Extract cell range references (e.g., `A1:B5`).
  - Handles complex formulas with nested functions, absolute references, and various operators.

## Installation

Install the package using npm or pnpm:

```bash
npm install @ywadi/dependency-graph
# or
pnpm add @ywadi/dependency-graph
```

## Usage

Require the library in your project to access the `DependencyGraph` class and the `extractCellsAndRanges` function.

```javascript
const { DependencyGraph, extractCellsAndRanges } = require('@ywadi/dependency-graph');

// Using the DependencyGraph
const graph = new DependencyGraph();
graph.addEdge('Sheet1!A1', 'Sheet1!B1', 'formula');
graph.addEdge('Sheet1!A1', 'Sheet1!C1', 'formula');

// Adding edges with metadata
graph.addEdge('A', 'B', 'weighted', { weight: 5, priority: 'high' });
graph.addEdge('B', 'C', 'weighted', { weight: 10, priority: 'low' });

// Default traversal (BFS)
console.log('Dependents of A1:', graph.traverse('Sheet1!A1'));

// Using DFS traversal
console.log('DFS traversal:', graph.traverse('Sheet1!A1', { strategy: 'dfs' }));

// Using the formula parser
const formula = '=SUM(A1:B5) + C3 - Sheet1!D4';
const { cells, ranges } = extractCellsAndRanges(formula);

console.log('Cells:', cells); // Output: ['A1', 'B5', 'C3', 'Sheet1!D4']
console.log('Ranges:', ranges); // Output: ['A1:B5']
```

## API Reference

### `DependencyGraph`

A class for representing a directed graph.

#### `new DependencyGraph()`

Creates a new, empty dependency graph.

#### `addNode(nodeId)`

Adds a node to the graph.

- **`nodeId`** (string): A unique identifier for the node.
- **Returns**: `true` if the node was added, `false` if it already exists.

#### `removeNode(nodeId)`

Removes a node and all its associated edges.

- **`nodeId`** (string): The ID of the node to remove.
- **Returns**: `true` if the node was removed, `false` if it did not exist.

#### `addEdge(fromNodeId, toNodeId, type)`

Adds a directed edge between two nodes. If nodes do not exist, they are created automatically.

- **`fromNodeId`** (string): The starting node ID.
- **`toNodeId`** (string): The ending node ID.
- **`type`** (string): The type of the dependency (e.g., 'formula', 'link').
- **`data`** (any, optional): Optional data to store with the edge (e.g., `{ weight: 5 }`). Defaults to `{}`.

#### `removeEdge(fromNodeId, toNodeId)`

Removes a directed edge between two nodes.

- **`fromNodeId`** (string): The starting node ID.
- **`toNodeId`** (string): The ending node ID.
- **Returns**: `true` if the edge was removed, `false` if it did not exist.

#### `hasNode(nodeId)`

Checks if a node exists in the graph.

- **`nodeId`** (string): The ID of the node to check.
- **Returns**: `true` if the node exists, `false` otherwise.

#### `getDependents(nodeId, options)`

Gets the nodes that depend on a given node (its dependents).

- **`nodeId`** (string): The ID of the node.
- **`options`** (object, optional): Traversal options, same as `traverse`.
- **Returns**: An array of dependent node IDs.

#### `getDependencies(nodeId, options)`

Gets the nodes that a given node depends on (its dependencies).

- **`nodeId`** (string): The ID of the node.
- **`options`** (object, optional): Traversal options, same as `traverse`.
- **Returns**: An array of dependency node IDs.

#### `traverse(startNodeId, options)`

Traverses the graph from a starting node.

- **`startNodeId`** (string): The node to start from.
- **`options`** (object, optional):
  - `direction` ('outgoing' | 'incoming'): Direction to traverse. Defaults to `'outgoing'`.
  - `edgeTypes` (string | string[]): Edge type(s) to follow. Follows all types if not provided.
  - `strategy` ('bfs' | 'dfs'): Traversal strategy. Defaults to `'bfs'` (breadth-first search). Use `'dfs'` for depth-first search.
- **Returns**: An array of visited node IDs in traversal order.

#### `getTree(startNodeId, options)`

Builds a hierarchical tree structure starting from a given node.

- **`startNodeId`** (string): The node to start from.
- **`options`** (object, optional):
  - `direction` ('outgoing' | 'incoming'): Direction to traverse. Defaults to `'outgoing'`.
  - `edgeTypes` (string | string[]): Edge type(s) to follow. Follows all types if not provided.
- **Returns**: A tree object with `{node: string, children: Array}` structure, or `null` if the start node doesn't exist.

**Example:**

```javascript
const graph = new DependencyGraph();
graph.addEdge('A', 'B', 'link');
graph.addEdge('A', 'C', 'link');
graph.addEdge('B', 'D', 'link');
graph.addEdge('C', 'E', 'link');

const tree = graph.getTree('A');
console.log(JSON.stringify(tree, null, 2));
/*
Output:
{
  "node": "A",
  "children": [
    {
      "node": "B",
      "children": [
        {
          "node": "D",
          "children": []
        }
      ]
    },
    {
      "node": "C",
      "children": [
        {
          "node": "E",
          "children": []
        }
      ]
    }
  ]
}
*/

// Get tree in incoming direction (dependents)
const dependentsTree = graph.getTree('D', { direction: 'incoming' });

// Filter by edge type
const filteredTree = graph.getTree('A', { edgeTypes: 'formula' });
```

#### `executeOnTree(startNodeId, callback, options)`

Executes an async callback function on each node in the tree, starting from a given node. Sibling nodes execute in parallel, while parent nodes complete before their children execute. Each callback receives the parent's result, enabling waterfall-style async operations on tree structures.

This is particularly useful for:
- Async data fetching where child nodes need parent results
- Build pipelines where each step transforms input from parent
- Spreadsheet-like calculations where cells depend on other cells
- Resource loading in optimal order

- **`startNodeId`** (string): The node to start from.
- **`callback`** (async function): Async function called for each node: `(nodeId, parentResult, context) => result`
  - `nodeId` (string): The current node ID
  - `parentResult` (any): The value returned by the parent node's callback (null for root)
  - `context` (object): Contains `{ depth, path, parentNode, edgeType, edgeData, siblings }`
  - Returns: Any value that will be passed to children as `parentResult`
- **`options`** (object, optional):
  - `direction` ('outgoing' | 'incoming'): Direction to traverse. Defaults to `'outgoing'`.
  - `edgeTypes` (string | string[]): Edge type(s) to follow. Follows all types if not provided.
  - `errorStrategy` ('fail-fast' | 'collect' | 'skip-children'): How to handle errors. Defaults to `'fail-fast'`.
    - `'fail-fast'`: Stop execution and throw on first error
    - `'collect'`: Continue execution, collect errors in tree structure
    - `'skip-children'`: Skip children of failed nodes
  - `maxConcurrency` (number | null): Maximum concurrent executions. Defaults to `null` (unlimited).
  - `signal` (AbortSignal | null): AbortSignal for cancellation support.
  - `onProgress` (function | null): Progress callback called after each node: `(nodeId, result) => void`
- **Returns**: A promise that resolves to a tree object with execution results: `{node, result, error, isCircularRef, children}`

**Example 1: Basic waterfall computation**

```javascript
const graph = new DependencyGraph();
graph.addEdge('A', 'B', 'calc');
graph.addEdge('B', 'C', 'calc');

// Each node multiplies parent result by 2
const tree = await graph.executeOnTree('A', async (nodeId, parentResult) => {
  const value = parentResult ? parentResult * 2 : 10; // A starts with 10
  console.log(`${nodeId} = ${value}`);
  return value;
});

// Output:
// A = 10
// B = 20
// C = 40

console.log(tree.result); // 10
console.log(tree.children[0].result); // 20
console.log(tree.children[0].children[0].result); // 40
```

**Example 2: Async data fetching with parallel siblings**

```javascript
const graph = new DependencyGraph();
graph.addEdge('user-1', 'posts', 'fetch');
graph.addEdge('user-1', 'profile', 'fetch');
graph.addEdge('posts', 'comments', 'fetch');

// Fetch data for each node
const tree = await graph.executeOnTree('user-1', async (nodeId, parentData, context) => {
  console.log(`Fetching ${nodeId} at depth ${context.depth}`);

  // Simulate API calls
  if (nodeId === 'user-1') {
    return { userId: 1, name: 'John' };
  }
  if (nodeId === 'posts') {
    return await fetchUserPosts(parentData.userId);
  }
  if (nodeId === 'profile') {
    return await fetchUserProfile(parentData.userId);
  }
  // ... etc
});

// posts and profile fetch in parallel, comments waits for posts
```

**Example 3: Error handling with collect strategy**

```javascript
const graph = new DependencyGraph();
graph.addEdge('root', 'task-1', 'process');
graph.addEdge('root', 'task-2', 'process');
graph.addEdge('root', 'task-3', 'process');

// Process tasks, some may fail
const tree = await graph.executeOnTree('root',
  async (nodeId) => {
    if (nodeId === 'task-2') {
      throw new Error('Task 2 failed');
    }
    return `${nodeId} completed`;
  },
  { errorStrategy: 'collect' }
);

// Check results
tree.children.forEach(child => {
  if (child.error) {
    console.log(`${child.node} failed:`, child.error.message);
  } else {
    console.log(`${child.node}:`, child.result);
  }
});
```

**Example 4: Concurrency limiting**

```javascript
// Limit to 3 concurrent API calls
const tree = await graph.executeOnTree('root',
  async (nodeId) => {
    return await fetchData(nodeId);
  },
  { maxConcurrency: 3 }
);
```

**Example 5: Progress tracking**

```javascript
let completed = 0;
const tree = await graph.executeOnTree('root',
  async (nodeId) => processNode(nodeId),
  {
    onProgress: (nodeId, result) => {
      completed++;
      console.log(`Progress: ${completed} nodes completed`);
    }
  }
);
```

**Example 6: Using edge data in callbacks**

You can attach metadata to edges and access it in your callbacks via `context.edgeData`:

```javascript
const graph = new DependencyGraph();
graph.addEdge('A', 'B', 'weighted', { weight: 5, cost: 100 });
graph.addEdge('A', 'C', 'weighted', { weight: 3, cost: 50 });
graph.addEdge('B', 'D', 'weighted', { weight: 2, cost: 25 });

const tree = await graph.executeOnTree('A', async (nodeId, parentResult, context) => {
  // Access edge metadata through context.edgeData
  if (context.edgeData) {
    console.log(`${nodeId} - weight: ${context.edgeData.weight}, cost: ${context.edgeData.cost}`);
    return (parentResult || 0) + context.edgeData.weight;
  }
  return 0; // Root node
});

// Output:
// B - weight: 5, cost: 100
// C - weight: 3, cost: 50
// D - weight: 2, cost: 25
```

**Example 7: Different behavior based on edge type**

When a node is reached via different paths with different edge types, the callback is executed once for each unique edge type. This allows your callback to behave differently depending on how the node was reached:

```javascript
const graph = new DependencyGraph();
graph.addEdge('A', 'B', 'type1');
graph.addEdge('A', 'C', 'type2');
graph.addEdge('B', 'D', 'type1');  // D reached via type1
graph.addEdge('C', 'D', 'type2');  // D reached via type2 (different type!)

const tree = await graph.executeOnTree('A', async (nodeId, parentResult, context) => {
  // context.edgeType tells you which edge type was used to reach this node
  if (context.edgeType === 'type1') {
    console.log(`${nodeId} reached via type1 - processing as formula`);
    return processAsFormula(nodeId);
  } else if (context.edgeType === 'type2') {
    console.log(`${nodeId} reached via type2 - processing as reference`);
    return processAsReference(nodeId);
  }
  return nodeId;
});

// Output:
// A reached via null (root node)
// B reached via type1 - processing as formula
// C reached via type2 - processing as reference
// D reached via type1 - processing as formula
// D reached via type2 - processing as reference (executed again!)
```

**Note**: Nodes are only considered duplicates if they're reached via the **same** edge type. If a node is reached multiple times but through different edge types, the callback will execute for each unique edge type. This allows you to handle the same node differently based on the type of relationship used to reach it.

#### `hasCircularDependency(options)`

Checks if the graph contains any circular dependencies.

- **`options`** (object, optional):
  - `edgeTypes` (string | string[]): Edge type(s) to check.
- **Returns**: `true` if a cycle is found, otherwise `false`.

#### `findCircularDependency(options)`

Finds and returns the first circular dependency path discovered.

- **`options`** (object, optional):
  - `edgeTypes` (string | string[]): Edge type(s) to check.
- **Returns**: An array of node IDs representing the cycle, or `null` if no cycle is found.

#### `toMermaid()`

Generates a string definition for visualizing the graph using [Mermaid.js](https://mermaid-js.github.io/mermaid/#/).

- **Returns**: A Mermaid.js graph definition string.

```javascript
const graph = new DependencyGraph();
graph.addEdge('A', 'B', 'link');
graph.addEdge('B', 'C', 'link');
console.log(graph.toMermaid());
/*
Output:
graph TD;
    A["A"];
    B["B"];
    C["C"];
    A -- link --> B;
    B -- link --> C;
*/
```

#### `serialize()`

Serializes the current graph state into a JSON string, allowing it to be saved and restored later.

- **Returns**: A JSON string representing the graph's nodes and edges.

#### `deserialize(jsonString)`

A static method that creates a new `DependencyGraph` instance from a JSON string.

- **`jsonString`** (string): The JSON string created by the `serialize()` method.
- **Returns**: A new `DependencyGraph` instance with the deserialized state.

```javascript
const graph = new DependencyGraph();
graph.addEdge('A', 'B', 'link');

// Serialize the graph
const serializedData = graph.serialize();

// Deserialize the graph
const newGraph = DependencyGraph.deserialize(serializedData);
console.log(newGraph.hasNode('A')); // true
console.log(newGraph.getDependents('A')); // ['B']
```

### `extractCellsAndRanges(equation)`

Extracts all unique cell and range references from an Excel formula string.

- **`equation`** (string): The formula string (e.g., `=SUM(A1:B2)`).
- **Returns**: An object `{ cells: string[], ranges: string[] }` containing sorted arrays of unique references.

## Benchmarks

Performance benchmarks were run on a graph with 1,000 nodes and ~2,000 edges. The results below show the number of operations per second (higher is better).

| Method                | Operations/sec |
| --------------------- | -------------- |
| `addNode`             | ~4,386         |
| `addEdge`             | ~646           |
| `traverse (outgoing)` | ~2,000,997     |
| `getDependents`       | ~1,649,869     |
| `serialize`           | ~396           |
| `deserialize`         | ~320           |

*Benchmarks were run on a standard development machine. Results may vary based on hardware.*

## Development

To work on this project locally, clone the repository and install the development dependencies.

```bash
# Clone the repository
git clone <repository-url>
cd dependency-graph

# Install dependencies
pnpm install
```

### Running Tests

To run the test suite, use the following command:

```bash
pnpm test
```

This will execute all Jest tests and ensure the library is functioning correctly.
