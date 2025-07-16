export type Forest = {
    trees: Tree[];
    arrows: TArrow[];
}

export function makeForest(): Forest {
    return { trees: [], arrows: [] };
}


export type Tree = {
    nodes: Map<NodeId, TNode>;
    rootId?: NodeId;
}
export function makeTree(): Tree {
    return { nodes: new Map() };
}
export function getTreeRoot(t: Tree): TNode {
    if (t.rootId === undefined) throw new Error("tried to find root of empty tree");
    if (t.nodes.get(t.rootId) === undefined) throw new Error("root node does not exist");
    return t.nodes.get(t.rootId)!;
}


export type NodeId = string;
export type TNode = {
    id: NodeId;
    parent?: NodeId;
    label: string;
    children: NodeId[];
    numericalLabel?: number;
};
export function makeTNode(
    label: string,
    parent?: NodeId,
    children: NodeId[] = [],
    numericalLabel?: number,
    id: NodeId = crypto.randomUUID()
) {
    return { label, parent, children, id, numericalLabel };
}

export type TreeInsertionPosition = {
    parent: string;
    index: number;
};

export type TArrow = {
    label: string;
    start: NodeId;
    end: NodeId;
}

function clone(f: Forest): Forest {
    return structuredClone(f);
}

export function hasNode(f: Forest, target: NodeId): boolean {
    for (const t of f.trees) if (t.nodes.has(target)) return true;
    return false;
}

function findTreeWithNode(f: Forest, target: NodeId): Tree {
    for (const t of f.trees) if (t.nodes.has(target)) return t;
    throw new Error("node not found in tree");
}

export function findNode(f: Forest, target: NodeId): TNode | undefined {
    for (const t of f.trees) {
        if (t.nodes.has(target)) return t.nodes.get(target)!;
    };
    return undefined;
}

export function updateNodeLabel(f: Forest, target: NodeId, label: string): Forest {
    if (!hasNode(f, target)) return f;
    const mut: Forest = clone(f);

    const tree = findTreeWithNode(mut, target);
    tree.nodes.set(target, { ...tree.nodes.get(target)!, label });
    return mut;
}

function collectChildIds(t: Tree, target: NodeId): NodeId[] {
    const node = t.nodes.get(target);
    if (node === undefined) return []; // Error?
    return [...node.children, ...node.children.flatMap((c) => collectChildIds(t, c))];
}

/**
 * Remove the reference to a node from its parent
 */
function deparent(f: Forest, target: NodeId) {
    const parentId = findNode(f, target)?.parent;
    if (parentId !== undefined) {
        const parent = findNode(f, parentId);
        if (parent !== undefined) {
            parent.children = parent.children.filter((c) => c !== target);
        }
    }
}

function removeNodeAndChildren(f: Forest, target: NodeId): TNode[] {
    const tree = findTreeWithNode(f, target);
    const isRoot = tree.nodes.get(target)?.parent === undefined
    const toDelete = [target, ...collectChildIds(tree, target)];
    const fragment = toDelete.map((f) => tree.nodes.get(f)!);
    toDelete.map((d) => tree.nodes.delete(d));
    if (isRoot) f.trees = f.trees.filter((m) => m !== tree);
    return fragment;
}

export function deleteNode(f: Forest, target: NodeId): Forest {
    if (!hasNode(f, target)) return f;
    const mut: Forest = clone(f);

    deparent(mut, target);

    removeNodeAndChildren(mut, target);

    return mut;
}

export function makeChild(f: Forest, target: NodeId): Forest {
    if (!hasNode(f, target)) return f;
    const mut: Forest = clone(f);

    const tree = findTreeWithNode(mut, target);

    const newNode = makeTNode("∅", target);
    tree.nodes.set(newNode.id, newNode);
    tree.nodes.get(target)?.children.push(newNode.id);

    return mut;
}

export function moveNode(f: Forest, target: NodeId, newParent: NodeId, index: number): Forest {
    if (!hasNode(f, target)) return f;
    if (!hasNode(f, newParent)) return f;
    const mut: Forest = clone(f);

    // Decouple and extraction fragment
    deparent(mut, target);
    const fragment = removeNodeAndChildren(mut, target);

    // Reinsert fragment
    const newTree = findTreeWithNode(mut, newParent)
    fragment.map((f) => newTree.nodes.set(f.id, { ...f, parent: f.id === target ? newParent : f.parent }));

    findNode(mut, newParent)?.children.splice(index, 0, target);

    return mut;
}

export function makeSibling(f: Forest, target: NodeId, side: "left" | "right"): Forest {
    if (!hasNode(f, target)) return f;
    const mut: Forest = clone(f);

    const parentId = findNode(mut, target)?.parent;
    if (parentId === undefined) throw new Error("Cannot add a sibling to a root node");

    // Find tree containing parent
    const tree = findTreeWithNode(mut, parentId);

    // Add the new node the map.
    const newNode = makeTNode("∅", parentId);
    tree.nodes.set(newNode.id, newNode);

    // Add the reference to the parent.
    const parent = tree.nodes.get(parentId)!;
    const index = parent.children.findIndex((c) => c === target);
    parent.children.splice(index + (side === "right" ? 1 : 0), 0, newNode.id)

    return mut;
}