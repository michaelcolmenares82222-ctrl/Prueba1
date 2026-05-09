"use client";

/**
 * ComponentTree widget — recursive folder/component tree for dev contexts.
 *
 * Expected `data` shape:
 *   { root: TreeNode }
 *   where TreeNode = { name: string; description?: string; children?: TreeNode[] }
 */

import { motion } from "framer-motion";
import { ChevronRight, Folder, FileCode } from "lucide-react";

import type { WidgetProps } from "@/lib/ui-component-registry";

interface TreeNode {
  name: string;
  description?: string;
  children?: TreeNode[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseTreeNode(value: unknown, depth = 0): TreeNode | null {
  if (depth > 6) return null; // safety: clamp deep recursion
  if (!isRecord(value)) return null;
  const { name, description, children } = value;
  if (typeof name !== "string" || name.length === 0) return null;

  let parsedChildren: TreeNode[] | undefined;
  if (Array.isArray(children)) {
    parsedChildren = children
      .map((c) => parseTreeNode(c, depth + 1))
      .filter((c): c is TreeNode => c !== null);
    if (parsedChildren.length === 0) parsedChildren = undefined;
  }

  return {
    name,
    description: typeof description === "string" ? description : undefined,
    children: parsedChildren,
  };
}

function parseTreeData(data: unknown): TreeNode | null {
  if (!isRecord(data)) return null;
  return parseTreeNode(data.root);
}

export default function ComponentTree({ context, data }: WidgetProps) {
  const root = parseTreeData(data);
  const { colorScheme } = context;

  if (!root) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        role="status"
        aria-label="Cargando árbol de componentes"
      >
        <div className="flex items-center gap-3 mb-5 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-slate-200" />
          <div className="h-4 w-36 rounded bg-slate-200" />
        </div>
        <ul className="space-y-2 animate-pulse">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex gap-2 items-center">
              <div className="h-4 w-4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="Estructura del proyecto"
    >
      <header className="flex items-center gap-3 mb-5">
        <div
          className={`grid place-items-center h-9 w-9 rounded-xl text-white bg-gradient-to-br ${colorScheme.gradient}`}
          aria-hidden="true"
        >
          <Folder className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Estructura del proyecto
        </h3>
      </header>

      <ul className="font-mono text-xs leading-6" role="tree">
        <TreeNodeView node={root} depth={0} colorScheme={colorScheme} index={0} />
      </ul>
    </motion.section>
  );
}

function TreeNodeView({
  node,
  depth,
  colorScheme,
  index,
}: {
  node: TreeNode;
  depth: number;
  colorScheme: WidgetProps["context"]["colorScheme"];
  index: number;
}) {
  const isFolder = !!node.children?.length;
  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (depth + index) * 0.04 }}
      className="list-none"
      role="treeitem"
      aria-expanded={isFolder ? true : undefined}
    >
      <div
        className="flex items-center gap-1.5"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        {isFolder ? (
          <ChevronRight
            className={`h-3 w-3 rotate-90 ${colorScheme.accent}`}
            aria-hidden="true"
          />
        ) : (
          <span className="h-3 w-3" aria-hidden="true" />
        )}
        {isFolder ? (
          <Folder className={`h-3.5 w-3.5 ${colorScheme.accent}`} aria-hidden="true" />
        ) : (
          <FileCode className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        )}
        <span
          className={`${
            isFolder ? "font-semibold text-slate-900" : "text-slate-700"
          }`}
        >
          {node.name}
        </span>
        {node.description ? (
          <span className="text-slate-400 ml-2 truncate">
            {`// ${node.description}`}
          </span>
        ) : null}
      </div>
      {node.children?.length ? (
        <ul role="group" className="list-none">
          {node.children.map((child, i) => (
            <TreeNodeView
              key={`${depth}-${i}-${child.name}`}
              node={child}
              depth={depth + 1}
              colorScheme={colorScheme}
              index={i}
            />
          ))}
        </ul>
      ) : null}
    </motion.li>
  );
}
