import React, { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { GraphData } from '../../shared/messages';
import { PAGE_TYPE_COLORS } from '../../shared/constants';
import { Card } from '../ui/Card';

interface KnowledgeGraphProps {
  data: GraphData | null;
  loading: boolean;
}

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    // Arbitrary size for the nodes
    dagreGraph.setNode(node.id, { width: 180, height: 60 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: direction === 'LEFT-RIGHT' ? Position.Left : Position.Top,
      sourcePosition: direction === 'LEFT-RIGHT' ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - 90,
        y: nodeWithPosition.y - 30,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ data, loading }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    if (!data) return;

    // Build React Flow nodes
    const rawNodes = data.nodes.map((n) => {
      const color = PAGE_TYPE_COLORS[n.type as keyof typeof PAGE_TYPE_COLORS] || 'var(--accent-primary)';
      return {
        id: n.id,
        data: {
          label: (
            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: `1px solid ${color}`,
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: 500,
              width: '180px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              <div style={{
                fontSize: '9px',
                textTransform: 'uppercase',
                color,
                fontWeight: 600,
                marginBottom: '2px',
              }}>
                {n.type}
              </div>
              {n.label}
            </div>
          )
        },
        position: { x: 0, y: 0 },
      };
    });

    // Build React Flow edges
    const rawEdges = data.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
      style: { stroke: 'var(--border-strong)', strokeWidth: 1.5 },
      labelStyle: { fill: 'var(--text-tertiary)', fontSize: 9, fontWeight: 500 },
    }));

    const layouted = getLayoutedElements(rawNodes, rawEdges, 'LR');
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [data, setNodes, setEdges]);

  if (loading) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }} className="shimmer-loading">
        <span style={{ color: 'var(--text-secondary)' }}>Loading Knowledge Graph...</span>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          No research relationships tracked yet. Add notes or topics to build the graph.
        </span>
      </div>
    );
  }

  return (
    <Card padding="0" style={{ height: '500px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
          <MiniMap
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
            nodeColor={(node) => 'var(--accent-primary)'}
            maskColor="rgba(0, 0, 0, 0.4)"
          />
          <Background color="var(--border-strong)" gap={16} size={1} />
        </ReactFlow>
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(26, 29, 39, 0.85)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          zIndex: 4,
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--border-subtle)',
        }}>
          💡 Drag nodes to reorganize. Zoom with scroll.
        </div>
      </div>
    </Card>
  );
};
