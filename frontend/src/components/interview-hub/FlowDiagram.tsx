"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

type NodeType = "start" | "process" | "decision" | "end" | "database";

interface Node {
  id: string;
  label: string;
  type: NodeType;
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

interface FlowDiagramProps {
  nodes: Node[];
  edges: Edge[];
  explanations?: Record<string, string>;
}

const typeColors: Record<NodeType, { bg: string; border: string; text: string }> = {
  start: { bg: "#065f46", border: "#34d399", text: "#d1fae5" },
  end: { bg: "#7f1d1d", border: "#f87171", text: "#fee2e2" },
  process: { bg: "#1e3a5f", border: "#60a5fa", text: "#dbeafe" },
  decision: { bg: "#713f12", border: "#fbbf24", text: "#fef9c3" },
  database: { bg: "#3b0764", border: "#c084fc", text: "#f3e8ff" },
};

const NODE_W = 160;
const NODE_H = 50;
const H_GAP = 80;
const V_GAP = 80;
const PADDING = 60;

function layoutNodes(
  nodes: Node[],
  edges: Edge[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();

  for (const n of nodes) {
    adj.set(n.id, []);
    inDeg.set(n.id, 0);
  }
  for (const e of edges) {
    adj.get(e.from)?.push(e.to);
    inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1);
  }

  const levels = new Map<string, number>();
  const visited = new Set<string>();
  const queue: string[] = [];

  for (const n of nodes) {
    if ((inDeg.get(n.id) || 0) === 0) {
      queue.push(n.id);
      levels.set(n.id, 0);
    }
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const neighbor of adj.get(id) || []) {
      const nextLevel = (levels.get(id) || 0) + 1;
      if (!levels.has(neighbor) || (levels.get(neighbor) || 0) < nextLevel) {
        levels.set(neighbor, nextLevel);
      }
      queue.push(neighbor);
    }
  }

  const levelGroups = new Map<number, string[]>();
  for (const [id, level] of levels) {
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(id);
  }

  const maxNodesInLevel = Math.max(
    ...Array.from(levelGroups.values()).map((g) => g.length),
    1
  );
  const totalW = maxNodesInLevel * NODE_W + (maxNodesInLevel - 1) * H_GAP;

  for (const [level, ids] of levelGroups) {
    const startX = (totalW - (ids.length * NODE_W + (ids.length - 1) * H_GAP)) / 2;
    ids.forEach((id, i) => {
      positions.set(id, {
        x: startX + i * (NODE_W + H_GAP),
        y: level * (NODE_H + V_GAP),
      });
    });
  }

  return positions;
}

export function FlowDiagram({ nodes, edges, explanations }: FlowDiagramProps) {
  const positions = useMemo(() => layoutNodes(nodes, edges), [nodes, edges]);

  const minX = Math.min(...Array.from(positions.values()).map((p) => p.x)) - PADDING;
  const minY = Math.min(...Array.from(positions.values()).map((p) => p.y)) - PADDING;
  const maxX = Math.max(...Array.from(positions.values()).map((p) => p.x + NODE_W)) + PADDING;
  const maxY = Math.max(...Array.from(positions.values()).map((p) => p.y + NODE_H)) + PADDING;
  const svgW = maxX - minX;
  const svgH = maxY - minY;

  return (
    <svg
      viewBox={`${minX} ${minY} ${svgW} ${svgH}`}
      className="w-full h-auto max-h-[500px]"
      style={{ minHeight: "300px" }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;

        const x1 = from.x + NODE_W / 2;
        const y1 = from.y + NODE_H;
        const x2 = to.x + NODE_W / 2;
        const y2 = to.y;

        return (
          <motion.g
            key={`edge-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
          >
            <motion.line
              x1={x1}
              y1={y1}
              x2={x1}
              y2={y1}
              animate={{ x2, y2 }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: "easeInOut" }}
              stroke="#94a3b8"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
              strokeLinecap="round"
            />
            {edge.label && (
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 6}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={10}
                className="select-none"
              >
                {edge.label}
              </text>
            )}
          </motion.g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        const colors = typeColors[node.type] || typeColors.process;
        const isDecision = node.type === "decision";

        return (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: "easeOut" }}
          >
            {isDecision ? (
              <polygon
                points={`${pos.x + NODE_W / 2},${pos.y} ${pos.x + NODE_W},${pos.y + NODE_H / 2} ${pos.x + NODE_W / 2},${pos.y + NODE_H} ${pos.x},${pos.y + NODE_H / 2}`}
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth={2}
                rx={4}
              />
            ) : (
              <rect
                x={pos.x}
                y={pos.y}
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth={2}
              />
            )}
            <text
              x={pos.x + NODE_W / 2}
              y={pos.y + NODE_H / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={colors.text}
              fontSize={12}
              fontWeight={600}
              className="select-none pointer-events-none"
            >
              {node.label}
            </text>

            {explanations?.[node.id] && (
              <title>{explanations[node.id]}</title>
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}
