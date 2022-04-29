import {
    createStyles,
    Title,
    Pagination,
    MultiSelect,
    Grid,
} from "@mantine/core";
import { useState, useEffect } from "react";
import axios from "axios";
import { TradesTable } from "./TradesTable";
import { setTrades } from "./TradesSlice";
import { useDispatch } from "react-redux";

const sideData = [
    { value: "Long", label: "Long", group: "Side" },
    { value: "Short", label: "Short", group: "Side" },
];
const statusData = [
    { value: "Open", label: "Open", group: "Status" },
    { value: "Win", label: "Win", group: "Status" },
    { value: "Loss", label: "Loss", group: "Status" },
    { value: "BE", label: "BE", group: "Status" },
];

const useStyles = createStyles((theme) => ({
    title: {
        fontSize: 18,
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[3]
                : theme.colors.gray[4],
        textTransform: "uppercase",
    },
}));
export default function Trades() {
    const { classes } = useStyles();
    const [tradesData, setTradesData] = useState([]);
    const [activePage, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sideSelection, setSideSelection] = useState("");
    const [statusSelection, setstatusSelection] = useState("");
    const [allTickers, setAllTickers] = useState([]);
    const [tickerSelection, setTickerSelection] = useState("");

    const dispatch = useDispatch();

    const getTradesData = async () => {
        try {
            let URL = "http://192.168.40.118:8000/api/trades/?limit=100";

            if (activePage != 1) {
                URL += `&page=${activePage}`;
            }

            if (sideSelection != "") {
                URL += `&side=${sideSelection}`;
            }

            if (statusSelection != "") {
                URL += `&status=${statusSelection}`;
            }

            if (tickerSelection != "") {
                URL += `&symbol=${tickerSelection}`;
            }

            const { data } = await axios.get(URL);

            data.docs.forEach((item) => {
                let netLiq = 0;
                item.spreads.forEach((s) => {
                    if (s.status != "Open") return;
                    let spreadNetLiq = 0;
                    s.legs.forEach((leg) => {
                        if (leg.status != "Open") return;
                        let size = leg.size;
                        if (leg.instrumentType.includes("Option"))
                            size = leg.size * 100;
                        if (leg.direction == "Short") size *= -1;
                        leg.netLiq = size * leg?.tickerDetails?.closingPrices;
                        spreadNetLiq += leg.netLiq;
                    });
                    s.netLiq = spreadNetLiq;
                    netLiq += spreadNetLiq;
                });
                item.netLiq = netLiq;
            });

            setTradesData(data.docs);
            setTotalPages(data.totalPages);
            setPage(data.page);
            dispatch(setTrades(data.docs));
        } catch (error) {
            console.log(error);
        }
    };

    const getTickers = async () => {
        const { data } = await axios.get(
            `http://192.168.40.118:8000/api/portfolio/tickers`
        );

        setAllTickers(data);
    };

    useEffect(() => {
        getTradesData();
    }, [activePage, sideSelection, statusSelection, tickerSelection]);

    useEffect(() => {
        getTickers();
    }, []);

    return (
        <>
            <Grid
                columns={24}
                justify='space-between'
                align='center'
                gutter='xs'
                m={0}>
                <Grid.Col span={2}>
                    <Title order={4} className={classes.title} py='xs'>
                        Trades
                    </Title>
                </Grid.Col>
                <Grid.Col span={12}>
                    <MultiSelect
                        placeholder='Filter by Stock'
                        searchable
                        radius='xs'
                        data={allTickers}
                        limit={5}
                        value={tickerSelection}
                        onChange={setTickerSelection}
                    />
                </Grid.Col>
                <Grid.Col span={3}>
                    <MultiSelect
                        data={statusData}
                        placeholder='Filter by Status'
                        transitionDuration={150}
                        transition='pop-top-left'
                        transitionTimingFunction='ease'
                        value={statusSelection}
                        onChange={setstatusSelection}
                    />
                </Grid.Col>
                <Grid.Col span={3}>
                    <MultiSelect
                        data={sideData}
                        placeholder='Filter by Side'
                        transitionDuration={150}
                        transition='pop-top-left'
                        transitionTimingFunction='ease'
                        value={sideSelection}
                        onChange={setSideSelection}
                    />
                </Grid.Col>
                <Grid.Col span={4} align='right'>
                    {totalPages > 1 ? (
                        <Pagination
                            page={activePage}
                            onChange={setPage}
                            total={totalPages}
                            color='yellow'
                            size='xs'
                        />
                    ) : (
                        ""
                    )}
                </Grid.Col>
            </Grid>
            <TradesTable data={tradesData} />
        </>
    );
}
