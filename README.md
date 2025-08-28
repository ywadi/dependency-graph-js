# Dependency Graph

A versatile JavaScript library for creating, managing, and analyzing directed graphs. This module also includes a powerful utility for extracting cell and range references from Excel-style formula strings.

It is designed to be lightweight, with zero production dependencies, making it easy to integrate into any Node.js project.

## Features

- **Dependency Graph:**
  - Create directed graphs with typed edges.
  - Add and remove nodes and edges dynamically.
  - Traverse the graph in both outgoing (dependencies) and incoming (dependents) directions.
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
npm install dependency-graph
# or
pnpm add dependency-graph
```

## Usage

Require the library in your project to access the `DependencyGraph` class and the `extractCellsAndRanges` function.

```javascript
const { DependencyGraph, extractCellsAndRanges } = require('dependency-graph');

// Using the DependencyGraph
const graph = new DependencyGraph();
graph.addEdge('Sheet1!A1', 'Sheet1!B1', 'formula');
graph.addEdge('Sheet1!A1', 'Sheet1!C1', 'formula');

console.log('Dependents of A1:', graph.traverse('Sheet1!A1'));

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

#### `removeEdge(fromNodeId, toNodeId)`

Removes a directed edge between two nodes.

- **`fromNodeId`** (string): The starting node ID.
- **`toNodeId`** (string): The ending node ID.
- **Returns**: `true` if the edge was removed, `false` if it did not exist.

#### `traverse(startNodeId, options)`

Traverses the graph from a starting node.

- **`startNodeId`** (string): The node to start from.
- **`options`** (object, optional):
  - `direction` ('outgoing' | 'incoming'): Direction to traverse. Defaults to `'outgoing'`.
  - `edgeTypes` (string | string[]): Edge type(s) to follow. Follows all types if not provided.
- **Returns**: An array of visited node IDs.

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

### `extractCellsAndRanges(equation)`

Extracts all unique cell and range references from an Excel formula string.

- **`equation`** (string): The formula string (e.g., `=SUM(A1:B2)`).
- **Returns**: An object `{ cells: string[], ranges: string[] }` containing sorted arrays of unique references.

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
