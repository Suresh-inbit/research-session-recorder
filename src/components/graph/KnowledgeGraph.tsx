import React, { useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { GraphData } from '../../shared/messages';
import { PAGE_TYPE_COLORS } from '../../shared/constants';
import { tint } from '../../shared/color';
import { Card } from '../ui/Card';

interface KnowledgeGraphProps {
  data: GraphData | null;
  loading: boolean;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 30, ranksep: 120 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 68 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
      position: {
        x: (nodeWithPosition?.x || 0) - 100,
        y: (nodeWithPosition?.y || 0) - 34,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ data, loading }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!data) return;

    // Custom Laboratory Chip Nodes
    const rawNodes = data.nodes.map((n) => {
      const color = PAGE_TYPE_COLORS[n.type as keyof typeof PAGE_TYPE_COLORS] || 'var(--accent-primary)';
      return {
        id: n.id,
        data: {
          label: (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                border: `1px solid ${tint(color, 40)}`,
                borderLeft: `4px solid ${color}`,
                color: 'var(--text-primary)',
                fontSize: '11.5px',
                fontWeight: 600,
                width: '190px',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  marginBottom: '3px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {n.type}
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {n.label}
              </div>
            </div>
          ),
        },
        position: { x: 0, y: 0 },
      };
    });

    // Custom Edge telemetry paths
    const rawEdges = data.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
      style: { strokeWidth: 2 },
      labelStyle: { fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)' },
      labelBgStyle: { fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }));

    const layouted = getLayoutedElements(rawNodes, rawEdges, 'LR');
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [data, setNodes, setEdges]);

  if (loading) {
    return (
      <div
        style={{
          height: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
        }}
        className="shimmer-loading"
      >
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Synthesizing Knowledge Topology...</span>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div
        style={{
          height: '550px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '360px', padding: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--accent-primary)' }}>
            <i className="fi fi-rr-diagram-project" />
          </div>
          <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: '0 0 6px 0' }}>
            Knowledge Topology Uninitialized
          </h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
            As you browse interconnected papers, GitHub repos, and write tagged notes, your interactive concept map will form automatically here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card padding="0" variant="glass" style={{ height: '640px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          className="kg"
          fitView
          fitViewOptions={{ maxZoom: 1.1, padding: 0.15 }}
          nodesConnectable={false}
          attributionPosition="bottom-right"
        >
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable />
          <Background color="var(--border-subtle)" gap={20} size={1} />
        </ReactFlow>

        {/* Floating Observatory HUD Tip */}
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <i className="fi fi-rr-bulb" style={{ color: 'var(--accent-secondary)' }} />
          <span>Interactive topology: Drag nodes to arrange · Scroll to zoom · Click to inspect</span>
        </div>
      </div>
    </Card>
  );
};

