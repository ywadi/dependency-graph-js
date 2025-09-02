const Benchmark = require('benchmark');
const { DependencyGraph } = require('../lib');

const suite = new Benchmark.Suite();

const NODE_COUNT = 1000;
const EDGE_COUNT = 2000;

// Setup: Create a large graph for testing
const graph = new DependencyGraph();
for (let i = 0; i < NODE_COUNT; i++) {
  graph.addNode(`node${i}`);
}

for (let i = 0; i < EDGE_COUNT; i++) {
  const from = `node${Math.floor(Math.random() * NODE_COUNT)}`;
  const to = `node${Math.floor(Math.random() * NODE_COUNT)}`;
  if (from !== to) {
    graph.addEdge(from, to, 'benchmark');
  }
}

let serializedGraph;

console.log(`Running benchmarks with ${NODE_COUNT} nodes and approximately ${EDGE_COUNT} edges...\n`);

suite
  .add('addNode', () => {
    const g = new DependencyGraph();
    for (let i = 0; i < NODE_COUNT; i++) {
        g.addNode(`node${i}`);
    }
  })
  .add('addEdge', () => {
    const g = new DependencyGraph();
    for (let i = 0; i < NODE_COUNT; i++) {
        g.addNode(`node${i}`);
    }
    for (let i = 0; i < EDGE_COUNT; i++) {
        const from = `node${Math.floor(Math.random() * NODE_COUNT)}`;
        const to = `node${Math.floor(Math.random() * NODE_COUNT)}`;
        g.addEdge(from, to, 'benchmark');
    }
  })
  .add('traverse (outgoing)', () => {
    graph.traverse('node0');
  })
  .add('getDependents', () => {
    graph.getDependents('node0');
  })
  .add('serialize', () => {
    serializedGraph = graph.serialize();
  })
  .add('deserialize', () => {
    DependencyGraph.deserialize(serializedGraph);
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('\nFastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
