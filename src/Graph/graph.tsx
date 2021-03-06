import * as React from "react";
import { ReactNode } from "react";
import { runD3StuffSecondIteration } from "./secondIterationD3";
import { CaseNode } from "../listToGraph/interfaces";
import Select from "react-select";
import { DenseInput, MenuList, Checkbox } from "./components";
import { makeFlatNodes, isSelfOrInChildren } from "./graphUtils";
import { useDebounce } from "../utils";
import styles from "./secondIteration.module.css";

interface Props {
  onNodeHover?: (node: CaseNode, parent?: CaseNode) => void;
  onEdgeHover?: (node: CaseNode, parent?: CaseNode) => void;
  nodeHoverTooltip?: (node: CaseNode, parent?: CaseNode) => string;
  edgeHoverTooltip?: (node: CaseNode, parent?: CaseNode) => string;
  caseNodes: CaseNode[];
  nodeToStartWith: number;
  moreFilters?: ReactNode;
}

export function Graph({
  onNodeHover,
  onEdgeHover,
  nodeHoverTooltip,
  edgeHoverTooltip,
  caseNodes: inputCaseNodes,
  nodeToStartWith,
  moreFilters,
}: Props) {
  const focusFn = React.useRef<(e: Element) => void>(() => {});
  const containerRef = React.useRef<HTMLDivElement>(null);

  const flatNodes = React.useMemo(() => makeFlatNodes(inputCaseNodes), [
    inputCaseNodes,
  ]);

  const options = flatNodes
    .map(({ id, name }) => ({
      value: id,
      label: name,
    }))
    .sort((a, b) => {
      return a.label.localeCompare(b.label, "he", {
        sensitivity: "base",
        numeric: true,
      });
    });

  const [selectedNode, setSelectedNode] = React.useState(
    options.find((o) => o.value === nodeToStartWith)
  );
  const selectedNodeDebounced = useDebounce(selectedNode, 300);

  const [applyAsFilter, setApplyAsFilter] = React.useState(false);
  const [refresh, setRefresh] = React.useState(0);

  const [graphDense, setGraphDense] = React.useState(50);
  const graphDenseDebounced = useDebounce(graphDense, 10);

  const resize = () => {
    setRefresh(refresh + 1);
  };
  window.addEventListener("resize", resize);

  const maybeFilteredCaseNodes = React.useMemo(() => {
    if (applyAsFilter && selectedNode) {
      return inputCaseNodes.filter((c) => {
        return isSelfOrInChildren(selectedNode.value, c);
      });
    }

    return inputCaseNodes;
  }, [applyAsFilter, inputCaseNodes, selectedNode]);

  React.useEffect(
    () => {
      let destroyFn = () => {
        window.removeEventListener("resize", resize);
      };

      const onCaseClick = (e: any) => {
        const selected = options.find((option) => {
          return e.data.id === option.value;
        });
        setSelectedNode(selected);
      };

      if (containerRef.current) {
        const { destroy, focus } = runD3StuffSecondIteration(
          containerRef.current,
          maybeFilteredCaseNodes,
          onNodeHover,
          onEdgeHover,
          nodeHoverTooltip,
          edgeHoverTooltip,
          onCaseClick,
          graphDenseDebounced,
          refresh
        );

        focusFn.current = focus;
        destroyFn = destroy;
      }

      return destroyFn;
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      onNodeHover,
      onEdgeHover,
      nodeHoverTooltip,
      edgeHoverTooltip,
      maybeFilteredCaseNodes,
      graphDenseDebounced,
      refresh,
    ]
  );

  React.useEffect(() => {
    if (!selectedNodeDebounced) {
      return;
    }

    setFocusOnSelectedNode(selectedNodeDebounced.value);
  }, [focusFn, selectedNodeDebounced, applyAsFilter, graphDenseDebounced]);

  const setFocusOnSelectedNode = (id: number) => {
    window.requestAnimationFrame(() => {
      const el = document.querySelector(`.id-${id}`);
      const previousFocused = document.querySelector(`.${styles.focused}`);
      if (el) {
        focusFn.current && focusFn.current(el);
        el.firstElementChild?.classList.add(styles.focused);
        previousFocused?.classList.remove(styles.focused);
      }
    });
  };

  return (
    <>
      <div ref={containerRef} className={styles.container} />
      <div id="graph-select-container" className={styles.menuContainer}>
        <Select
          isSearchable={true}
          isClearable={true}
          isRtl={true}
          options={options}
          value={selectedNode}
          components={{ MenuList }}
          onChange={(v: any) => {
            setSelectedNode(v);
          }}
        />
        <Checkbox
          checked={applyAsFilter}
          onChange={(e) => setApplyAsFilter((v) => !v)}
          label="Use As Filter"
        />
        <DenseInput graphDense={graphDense} setGraphDense={setGraphDense} />
        {moreFilters}
      </div>
    </>
  );
}
