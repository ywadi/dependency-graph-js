/**
 * @class DependencyGraph
 * @description A class to represent and manage a directed graph of dependencies,
 * similar to spreadsheet cell dependencies. It supports typed edges, traversal
 * in both directions, circular dependency detection, and Mermaid.js visualization.
 */
module.exports = class DependencyGraph {
  /**
   * @constructor
   */
  constructor() {
    /**
     * @private
     * @type {Map<string, Set<string>>}
     * Stores outgoing dependencies (node -> depends on).
     * The key is the node ID, and the value is a Set of node IDs it depends on.
     */
    this.nodes = new Map();

    /**
     * @private
     * @type {Map<string, Set<string>>}
     * Stores incoming dependencies (node <- is depended on by).
     * The key is the node ID, and the value is a Set of node IDs that depend on it.
     */
    this.incomingEdges = new Map();

    /**
     * @private
     * @type {Map<string, {to: string, type: string}>}
     * Stores the edges with their types. The key is a unique identifier for the edge,
     * formatted as 'fromNodeId->toNodeId'.
     */
    this.edges = new Map();
  }

  /**
   * Adds a node to the graph.
   * @param {string} nodeId - The unique identifier for the node (e.g., 'Sheet1!A1').
   * @returns {boolean} - True if the node was added, false if it already exists.
   */
  addNode(nodeId) {
    if (this.nodes.has(nodeId)) {
      return false;
    }
    this.nodes.set(nodeId, new Set());
    this.incomingEdges.set(nodeId, new Set());
    return true;
  }

  /**
   * Removes a node and all its associated edges from the graph.
   * @param {string} nodeId - The ID of the node to remove.
   * @returns {boolean} - True if the node was removed, false if it didn't exist.
   */
  removeNode(nodeId) {
    if (!this.nodes.has(nodeId)) {
      return false;
    }

    // Remove all outgoing edges from this node
    const nodesThisDependsOn = this.nodes.get(nodeId) || new Set();
    for (const dependencyId of nodesThisDependsOn) {
      this.edges.delete(`${nodeId}->${dependencyId}`);
      this.incomingEdges.get(dependencyId)?.delete(nodeId);
    }

    // Remove all incoming edges to this node
    const nodesThatDependOnThis = this.incomingEdges.get(nodeId) || new Set();
    for (const dependentId of nodesThatDependOnThis) {
      this.edges.delete(`${dependentId}->${nodeId}`);
      this.nodes.get(dependentId)?.delete(nodeId);
    }

    // Finally, remove the node itself
    this.nodes.delete(nodeId);
    this.incomingEdges.delete(nodeId);

    return true;
  }

  /**
   * Adds a directed edge between two nodes with a specific type.
   * If the nodes do not exist, they will be created.
   * @param {string} fromNodeId - The ID of the node where the edge starts.
   * @param {string} toNodeId - The ID of the node where the edge ends.
   * @param {string} type - The type of the dependency (e.g., 'equational').
   */
  addEdge(fromNodeId, toNodeId, type) {
    this.addNode(fromNodeId);
    this.addNode(toNodeId);

    // Add outgoing edge reference
    this.nodes.get(fromNodeId).add(toNodeId);
    // Add incoming edge reference
    this.incomingEdges.get(toNodeId).add(fromNodeId);

    this.edges.set(`${fromNodeId}->${toNodeId}`, { to: toNodeId, type });
  }

  /**
   * Checks if a node exists in the graph.
   * @param {string} nodeId - The ID of the node to check.
   * @returns {boolean} - True if the node exists, false otherwise.
   */
  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  /**
   * Gets the nodes that depend on a given node (its dependents).
   * @param {string} nodeId - The ID of the node.
   * @param {Object} [options={}] - Traversal options.
   * @returns {string[]} - An array of dependent node IDs.
   */
  getDependents(nodeId, options = {}) {
    const result = this.traverse(nodeId, { ...options, direction: 'outgoing' });
    const index = result.indexOf(nodeId);
    if (index > -1) {
      result.splice(index, 1);
    }
    return result;
  }

  /**
   * Gets the nodes that a given node depends on (its dependencies).
   * @param {string} nodeId - The ID of the node.
   * @param {Object} [options={}] - Traversal options.
   * @returns {string[]} - An array of dependency node IDs.
   */
  getDependencies(nodeId, options = {}) {
    const result = this.traverse(nodeId, { ...options, direction: 'incoming' });
    const index = result.indexOf(nodeId);
    if (index > -1) {
      result.splice(index, 1);
    }
    return result;
  }

  /**
   * Removes an edge between two nodes.
   * @param {string} fromNodeId - The ID of the starting node.
   * @param {string} toNodeId - The ID of the ending node.
   * @returns {boolean} - True if the edge was removed, false if it didn't exist.
   */
  removeEdge(fromNodeId, toNodeId) {
    const edgeId = `${fromNodeId}->${toNodeId}`;
    if (!this.edges.has(edgeId)) {
      return false;
    }
    this.edges.delete(edgeId);

    // Remove outgoing reference
    this.nodes.get(fromNodeId)?.delete(toNodeId);
    // Remove incoming reference
    this.incomingEdges.get(toNodeId)?.delete(fromNodeId);
    
    return true;
  }

  /**
   * Traverses the graph from a starting node, following edges of specified types.
   * @param {string} startNodeId - The ID of the node to start traversal from.
   * @param {Object} [options={}] - Traversal options.
   * @param {string|string[]} [options.edgeTypes] - The edge type(s) to follow. If not provided, all edges are followed.
   * @param {'outgoing'|'incoming'} [options.direction='outgoing'] - The direction to traverse. 'outgoing' finds dependencies; 'incoming' finds dependents.
   * @returns {string[]} - An array of visited node IDs in traversal order.
   */
  traverse(startNodeId, options = {}) {
    if (!this.nodes.has(startNodeId)) {
      console.error("Start node for traversal does not exist.");
      return [];
    }

    const { edgeTypes, direction = 'outgoing' } = options;
    const types = edgeTypes ? (Array.isArray(edgeTypes) ? edgeTypes : [edgeTypes]) : null;

    const visited = new Set();
    const queue = [startNodeId];
    const result = [];

    const adjacencyMap = direction === 'outgoing' ? this.nodes : this.incomingEdges;

    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      if (!visited.has(currentNodeId)) {
        visited.add(currentNodeId);
        result.push(currentNodeId);

        const neighbors = adjacencyMap.get(currentNodeId) || new Set();
        for (const neighborId of neighbors) {
          const edgeId = direction === 'outgoing'
            ? `${currentNodeId}->${neighborId}`
            : `${neighborId}->${currentNodeId}`;

          const edge = this.edges.get(edgeId);
          if (!edge) continue;

          if (!types || types.includes(edge.type)) {
            if (!visited.has(neighborId)) {
              queue.push(neighborId);
            }
          }
        }
      }
    }
    return result;
  }


  /**
   * Detects circular dependencies in the graph.
   * @param {Object} [options={}] - Detection options.
   * @param {string|string[]} [options.edgeTypes] - The edge type(s) to check. If not provided, all edges are checked.
   * @returns {boolean} - True if a circular dependency is found, false otherwise.
   */
  hasCircularDependency(options = {}) {
    const edgeTypes = options.edgeTypes ? (Array.isArray(options.edgeTypes) ? options.edgeTypes : [options.edgeTypes]) : null;
    const visiting = new Set();
    const visited = new Set();

    for (const nodeId of this.nodes.keys()) {
      if (this._detectCycleUtil(nodeId, visiting, visited, edgeTypes)) {
        return true;
      }
    }
    return false;
  }

  /**
   * A recursive utility function for hasCircularDependency, using DFS.
   * @private
   */
  _detectCycleUtil(nodeId, visiting, visited, edgeTypes) {
    visiting.add(nodeId);

    const neighbors = this.nodes.get(nodeId) || new Set();
    for (const neighborId of neighbors) {
      const edgeId = `${nodeId}->${neighborId}`;
      const edge = this.edges.get(edgeId);

      if (edge && (!edgeTypes || edgeTypes.includes(edge.type))) {
        if (visiting.has(neighborId)) {
          return true; // Cycle detected
        }
        if (!visited.has(neighborId)) {
          if (this._detectCycleUtil(neighborId, visiting, visited, edgeTypes)) {
            return true;
          }
        }
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  }

  /**
   * Finds a circular dependency in the graph and returns the path.
   * @param {Object} [options={}] - Detection options.
   * @param {string|string[]} [options.edgeTypes] - The edge type(s) to check. If not provided, all edges are checked.
   * @returns {string[]|null} - An array of node IDs representing the cycle path, or null if no cycle is found.
   */
  findCircularDependency(options = {}) {
    const edgeTypes = options.edgeTypes ? (Array.isArray(options.edgeTypes) ? options.edgeTypes : [options.edgeTypes]) : null;
    const visited = new Set(); // Nodes that have been fully explored in any DFS run.

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        // For each new starting node, we start a new DFS with a fresh path and visiting set.
        const cyclePath = this._findCycleUtil(nodeId, new Set(), visited, edgeTypes, []);
        if (cyclePath) {
          return cyclePath;
        }
      }
    }
    return null;
  }

  /**
   * A recursive utility function for findCircularDependency.
   * @private
   */
  _findCycleUtil(nodeId, visiting, visited, edgeTypes, path) {
    visiting.add(nodeId);
    path.push(nodeId);

    const neighbors = this.nodes.get(nodeId) || new Set();
    for (const neighborId of neighbors) {
      const edgeId = `${nodeId}->${neighborId}`;
      const edge = this.edges.get(edgeId);

      if (edge && (!edgeTypes || edgeTypes.includes(edge.type))) {
        if (visiting.has(neighborId)) {
          // Cycle detected. Construct the path.
          const cycleStartIndex = path.indexOf(neighborId);
          const cyclePath = path.slice(cycleStartIndex);
          cyclePath.push(neighborId); // Add the final node to show the loop closure.
          return cyclePath;
        }

        // We only recurse on nodes that have not been fully explored yet.
        if (!visited.has(neighborId)) {
          const result = this._findCycleUtil(neighborId, visiting, visited, edgeTypes, path);
          if (result) {
            return result; // Propagate the found cycle path up the call stack.
          }
        }
      }
    }

    visiting.delete(nodeId);
    path.pop(); // Backtrack
    visited.add(nodeId); // Mark this node as fully explored and safe.
    return null;
  }

  /**
   * Serializes the graph state to a JSON string.
   * @returns {string} - A JSON string representing the graph.
   */
  serialize() {
    const data = {
      nodes: Array.from(this.nodes.entries(), ([k, v]) => [k, Array.from(v)]),
      incomingEdges: Array.from(this.incomingEdges.entries(), ([k, v]) => [k, Array.from(v)]),
      edges: Array.from(this.edges.entries()),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Deserializes a JSON string into a new DependencyGraph instance.
   * @param {string} jsonString - The JSON string representing the graph.
   * @returns {DependencyGraph} - A new DependencyGraph instance.
   */
  static deserialize(jsonString) {
    const data = JSON.parse(jsonString);
    const graph = new DependencyGraph();

    graph.nodes = new Map(data.nodes.map(([key, value]) => [key, new Set(value)]));
    graph.incomingEdges = new Map(data.incomingEdges.map(([key, value]) => [key, new Set(value)]));
    graph.edges = new Map(data.edges);

    return graph;
  }

  /**
   * Generates a string definition for visualizing the graph using Mermaid.js.
   * @returns {string} - The Mermaid.js graph definition.
   */
  toMermaid() {
    let mermaidString = 'graph TD;\n';
    const nodeIds = Array.from(this.nodes.keys());
    
    nodeIds.forEach(nodeId => {
        mermaidString += `    ${nodeId}["${nodeId}"];\n`;
    });

    for (const [edgeId, edge] of this.edges.entries()) {
      const [from] = edgeId.split('->');
      mermaidString += `    ${from} -- ${edge.type} --> ${edge.to};\n`;
    }

    return mermaidString;
  }
}
