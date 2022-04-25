import { Title, createStyles, ScrollArea } from "@mantine/core";
import { useState, useEffect, useMemo } from "react";
import { useViewportSize } from "@mantine/hooks";
import { Alert } from "@mantine/core";
import { AlertCircle } from "tabler-icons-react";
import ReactFlow from "react-flow-renderer";

import axios from "axios";
import { SpreadCard } from "./SpreadCard";

const useStyles = createStyles((theme, { height, width }) => ({
    title: {
        fontSize: 18,
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[3]
                : theme.colors.gray[4],
        textTransform: "uppercase",
    },

    container: {
        width: (width / 24) * 4 + 60,
        height: height - 225,
    },
}));

export default function SpreadsGraph() {
    const { height, width } = useViewportSize();
    const { classes } = useStyles({ height, width });
    const [scrolled, setScrolled] = useState(false);
    const [trade, settrade] = useState(1);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const nodeTypes = useMemo(() => ({ spreadCard: SpreadCard }), []);
    const [tradeData, setTradeData] = useState(null);

    const getTradeData = async () => {
        const { data } = await axios.get(
            `http://192.168.40.118:8000/api/trades/detail/?id=625d6060fd928229a6eae9d8`
        );

        setTradeData(data[0]);
    };

    const prepGraphData = () => {
        let nodes = [];
        let edges = [];

        if (tradeData)
            tradeData.spreads.forEach((spread, index) => {
                let nodeData = {};
                let edgeData = {};
                nodeData.id = spread._id;
                nodeData.type = "spreadCard";
                nodeData.data = { spread };
                nodeData.position = { x: Math.random() * 1000, y: index * 200 };
                nodes.push(nodeData);
                if (spread.prevSpread) {
                    edgeData.id = `${spread.prevSpread}-${spread._id}`;
                    edgeData.target = spread._id;
                    edgeData.source = spread.prevSpread;
                    edgeData.animated =
                        spread.status != "Closed" ? true : false;
                    edges.push(edgeData);
                }
            });
        setNodes(nodes);
        setEdges(edges);
    };

    useEffect(() => {
        getTradeData();
    }, [trade]);

    useEffect(() => {
        prepGraphData();
    }, [tradeData]);

    return (
        <div>
            <Title order={4} className={classes.title} py='xs'>
                Spreads
            </Title>
            <ScrollArea
                scrollbarSize={2}
                sx={{ height: height - 225 }}
                onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                {trade == 0 ? (
                    <Alert
                        icon={<AlertCircle size={24} />}
                        title='Spread Flows'
                        color='gray'>
                        Select a trade to see it's spread flow
                    </Alert>
                ) : (
                    <div className={classes.container}>
                        <ReactFlow
                            panOnScroll={true}
                            panOnDrag={true}
                            nodeTypes={nodeTypes}
                            defaultNodes={nodes}
                            defaultEdges={edges}
                        />
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
